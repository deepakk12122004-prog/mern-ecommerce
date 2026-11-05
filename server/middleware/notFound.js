 
const AppError = require("../utils/AppError"); 
 
// Runs when no route matched the request. It creates a 404 error 
// and passes it on to the central error handler. 
function notFound(req, res, next) { 
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404)); 
} 
 
module.exports = notFound; 