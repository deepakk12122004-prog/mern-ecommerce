const { isProduction } = require("../config/env"); 
const { MAX_IMAGE_MB } = require("../config/constants"); 
 
// Turns known library errors into friendly 4xx answers. 
// Returns { statusCode, message, details } or null if unknown. 
function translateKnownError(err) { 
  // Multer: problems while reading an uploaded file 
  if (err.name === "MulterError") { 
    if (err.code === "LIMIT_FILE_SIZE") { 
      return { 
        statusCode: 413, 
        message: `The image is too large. The maximum size is ${MAX_IMAGE_MB} MB.`, 
      }; 
    } 
    if (err.code === "LIMIT_UNEXPECTED_FILE") { 
      return { 
        statusCode: 400, 
        message: 'Send exactly one image in a form field named "image".', 
      }; 
    } 
    return { 
      statusCode: 400, 
      message: "The upload could not be read. Please try another image.", 
    }; 
  } 
 
  // Mongoose: a model rule failed (for example a name that is too short) 
  if (err.name === "ValidationError" && err.errors) { 
    const details = Object.values(err.errors).map((e) => ({ 
      field: e.path, 
      message: e.message, 
    })); 
    if (details.length > 0) { 
      return { statusCode: 400, message: details[0].message, details }; 
    } 
  } 
 
  // Mongoose: a bad value, such as an invalid product id in the URL 
  if (err.name === "CastError") { 
    const what = err.path === "_id" ? "id" : err.path; 
    return { statusCode: 400, message: `Invalid ${what}.` }; 
  } 
 
  // MongoDB: a unique index was violated (for example a duplicate email) 
  if (err.code === 11000) { 
    const field = Object.keys(err.keyValue || {})[0] || "value"; 
    return { statusCode: 409, message: `That ${field} is already in use.` }; 
  } 
 
  // Login token problems 
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") { 
    return { 
      statusCode: 401, 
      message: "Session expired or invalid. Please log in again.", 
    }; 
  } 
 
  // Errors thrown by express.json() 
  if (err.type === "entity.parse.failed") { 
    return { statusCode: 400, message: "Invalid JSON in request body." }; 
  } 
  if (err.type === "entity.too.large") { 
    return { statusCode: 413, message: "Request body is too large." }; 
  } 
 
  return null; 
} 
 
// The ONE place where every error becomes a JSON response. 
// Express recognises an error handler by its 4 parameters, so keep all 4. 
// eslint-disable-next-line no-unused-vars 
function errorHandler(err, req, res, next) { 
  if (res.headersSent) return next(err); 
 
  const known = translateKnownError(err); 
 
  let statusCode = known ? known.statusCode : err.statusCode || err.status || 500; 
  let message = known ? known.message : err.message || "Server error"; 
  const details = known && known.details ? known.details : err.details; 
 
  // Never trust a weird status value 
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) { 
    statusCode = 500; 
  } 
 
  const isServerError = statusCode >= 500; 
  if (isServerError) console.error(err); // full details on the server only 
 
  // In production, do not leak internal error details to the client. 
  // (Our own AppError messages, like "Could not upload the image", are 
  // written to be safe, so they are kept.) 
  if (isServerError && isProduction && !err.isOperational) { 
    message = "Something went wrong on the server."; 
  } 
 
  const body = { success: false, message }; 
  if (details) body.details = details; 
  if (isServerError && !isProduction) body.stack = err.stack; 
 
  res.status(statusCode).json(body); 
} 
 
module.exports = errorHandler;