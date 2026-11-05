const jwt = require("jsonwebtoken"); 
const { 
  JWT_SECRET, 
  JWT_EXPIRES_DAYS, 
  cookieSameSite, 
  cookieSecure, 
} = require("../config/env"); 
 
const COOKIE_NAME = "token"; 
const MAX_AGE_MS = JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000; 
 
// Settings that make the cookie safe. 
function cookieOptions() { 
  return { 
    httpOnly: true, // JavaScript in the browser cannot read it 
    secure: cookieSecure, // sent over HTTPS only (production) 
    sameSite: cookieSameSite, 
    path: "/", 
  }; 
} 
 
// The token only stores the user id. The role is read fresh from 
// the database on every request, so role changes apply immediately. 
function signToken(userId) { 
  return jwt.sign({ id: String(userId) }, JWT_SECRET, { 
    algorithm: "HS256", 
    expiresIn: `${JWT_EXPIRES_DAYS}d`, 
  }); 
} 
 
function setAuthCookie(res, userId) { 
  res.cookie(COOKIE_NAME, signToken(userId), { 
    ...cookieOptions(), 
    maxAge: MAX_AGE_MS, 
  }); 
} 
function clearAuthCookie(res) { 
res.clearCookie(COOKIE_NAME, cookieOptions()); 
} 
module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };