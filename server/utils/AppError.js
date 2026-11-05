// An Error that carries an HTTP status code, so we can write: 
//   
class AppError extends Error { 
constructor(message, statusCode = 500) { 
super(message); 
this.statusCode = statusCode; 
Error.captureStackTrace(this, this.constructor); 
  } 
} 
 
module.exports = AppError;