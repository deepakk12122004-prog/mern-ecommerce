const { validationResult } = require("express-validator"); 
const AppError = require("../utils/AppError"); 
// Put this after the validation rules in a route. 
// If any rule failed, it stops the request with a 400 error. 
function validate(req, res, next) { 
const result = validationResult(req); 
if (result.isEmpty()) return next(); 
const details = result.array({ onlyFirstError: true }).map((e) => ({ 
field: e.path || e.param, 
message: e.msg, 
})); 
const error = new AppError(details[0].message, 400); 
error.details = details; 
return next(error); 
} 
module.exports = validate;