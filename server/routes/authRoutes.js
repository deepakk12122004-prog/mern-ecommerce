const express = require("express"); 
const { body } = require("express-validator"); 
const rateLimit = require("express-rate-limit"); 
 
const { 
  register, 
  login, 
  logout, 
  getMe, 
} = require("../controllers/authController"); 
const { protect } = require("../middleware/auth"); 
const validate = require("../middleware/validate"); 
const { isProduction } = require("../config/env"); 
 
const router = express.Router(); 
 
// Slows down password guessing: limited tries per IP per 15 minutes. 
// (The limit is higher in development so testing is easy.) 
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  limit: isProduction ? 10 : 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { 
    success: false, 
    message: "Too many attempts. Please try again in 15 minutes.", 
  }, 
}); 
 
// ---- Validation rules ---- 
// isString() also blocks tricks like sending {"$gt": ""} as an email. 
const emailRule = () => 
  body("email") 
    .isString() 
    .withMessage("Email is required.") 
    .bail() 
    .trim() 
    .toLowerCase() 
    .isEmail() 
    .withMessage("Enter a valid email address.") 
    .bail() 
    .isLength({ max: 254 }) 
    .withMessage("Email is too long."); 
 
const registerRules = [ 
  body("name") 
    .isString() 
    .withMessage("Name is required.") 
    .bail() 
    .trim() 
    .isLength({ min: 2, max: 50 }) 
    .withMessage("Name must be 2 to 50 characters."), 
  emailRule(), 
  body("password") 
    .isString() 
    .withMessage("Password is required.") 
    .bail() 
    .isLength({ min: 8, max: 72 }) 
    .withMessage("Password must be 8 to 72 characters."), 
]; 
 
const loginRules = [ 
  emailRule(), 
  body("password") 
    .isString() 
    .withMessage("Password is required.") 
    .bail() 
    .notEmpty() 
    .withMessage("Password is required.") 
    .bail() 
    .isLength({ max: 72 }) 
    .withMessage("Invalid email or password."), 
]; 
 
// ---- Routes (mounted at /api/auth) ---- 
router.post("/register", authLimiter, registerRules, validate, register); 
router.post("/login", authLimiter, loginRules, validate, login); 
router.post("/logout", logout); 
router.get("/me", protect, getMe); 
 
module.exports = router;