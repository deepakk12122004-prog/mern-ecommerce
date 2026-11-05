// Wraps an async controller so that any error it throws 
// is passed to our central errorHandler. 
const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next); 
 
module.exports = asyncHandler;