const AppError = require("../utils/AppError"); 
 
// Use AFTER protect. 401 = not logged in, 403 = logged in but not allowed. 
function adminOnly(req, res, next) { 
  if (!req.user) { 
    return next(new AppError("Not logged in. Please log in.", 401)); 
  } 
  if (req.user.role !== "admin") { 
    return next(new AppError("Admin access required.", 403)); 
  } 
  return next(); 
} 
 
module.exports = { adminOnly };