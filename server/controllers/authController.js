const bcrypt = require("bcryptjs"); 
const User = require("../models/User"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { setAuthCookie, clearAuthCookie } = require("../utils/generateToken"); 
 
// Used when an email does not exist, so a wrong email and a wrong 
// password take the same time to answer (stops "who has an account?" 
// guessing by timing). 
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12); 
 
// Only these fields are ever sent to the browser. 
// Listing them by name means a hash can never leak by accident. 
function toPublicUser(user) { 
  return { 
    _id: user._id, 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    createdAt: user.createdAt, 
  }; 
} 
 
// POST /api/auth/register 
const register = asyncHandler(async (req, res) => { 
  // We take ONLY these three fields. A "role" sent by the browser 
  // is ignored, so nobody can register themselves as admin. 
  const { name, email, password } = req.body; 
 
  const existing = await User.findOne({ email }); 
  if (existing) { 
    throw new AppError("An account with this email already exists.", 409); 
  } 
 
  // The model hashes the password before saving 
  const user = await User.create({ name, email, password }); 
 
  setAuthCookie(res, user._id); 
  res.status(201).json({ success: true, data: toPublicUser(user) }); 
}); 
 
// POST /api/auth/login 
const login = asyncHandler(async (req, res) => { 
  const { email, password } = req.body; 
 
  // password is hidden by default, so we ask for it here 
  const user = await User.findOne({ email }).select("+password"); 
 
  let passwordOk = false; 
  if (user) { 
    passwordOk = await user.comparePassword(password); 
  } else { 
    await bcrypt.compare(password, DUMMY_HASH); 
  } 
 
  // Same message for "no such email" and "wrong password" 
  if (!passwordOk) { 
    throw new AppError("Invalid email or password.", 401); 
  } 
 
  setAuthCookie(res, user._id); 
  res.status(200).json({ success: true, data: toPublicUser(user) }); 
}); 
 
// POST /api/auth/logout 
const logout = asyncHandler(async (req, res) => { 
  clearAuthCookie(res); 
  res.status(200).json({ success: true, message: "Logged out." }); 
}); 
 
// GET /api/auth/me   (protect runs first and sets req.user) 
const getMe = asyncHandler(async (req, res) => { 
  res.set("Cache-Control", "no-store"); 
  res.status(200).json({ success: true, data: toPublicUser(req.user) }); 
}); 
 
module.exports = { register, login, logout, getMe };