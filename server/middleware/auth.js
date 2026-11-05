const jwt = require("jsonwebtoken"); 
const User = require("../models/User"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { JWT_SECRET } = require("../config/env"); 
const { COOKIE_NAME, clearAuthCookie } = require("../utils/generateToken"); 
 
// Reads the login cookie. Returns { user } when it is valid, 
// or { problem } with the reason when it is not. 
async function lookupUser(req) { 
  const token = req.cookies && req.cookies[COOKIE_NAME]; 
  if (!token) return { problem: "missing" }; 
 
  let payload; 
  try { 
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }); 
  } catch (err) { 
    return { problem: "invalid" }; 
  } 
 
  const user = await User.findById(payload.id); 
  if (!user) return { problem: "gone" }; 
 
  return { user }; 
} 
 
// Put "protect" before any route that needs a logged-in user. 
// On success, req.user holds the user from the database. 
const protect = asyncHandler(async (req, res, next) => { 
  const { user, problem } = await lookupUser(req); 
 
  if (user) { 
    req.user = user; 
    return next(); 
  } 
 
  if (problem === "missing") { 
    throw new AppError("Not logged in. Please log in.", 401); 
  } 
 
  clearAuthCookie(res); // the cookie is useless, so remove it 
  if (problem === "gone") { 
    throw new AppError("This account no longer exists.", 401); 
  } 
  throw new AppError("Session expired or invalid. Please log in again.", 401); 
}); 
 
// For pages that work for everyone, but show more to some users 
// (for example, admins can see hidden products). 
// Never blocks the request: guests just have no req.user. 
const optionalAuth = asyncHandler(async (req, res, next) => { 
const { user } = await lookupUser(req); 
if (user) req.user = user; 
next(); 
}); 
module.exports = { protect, optionalAuth };