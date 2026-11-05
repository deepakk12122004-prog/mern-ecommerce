const express = require("express"); 
const { body } = require("express-validator"); 
const rateLimit = require("express-rate-limit"); 
 
const { quoteCart } = require("../controllers/cartController"); 
const validate = require("../middleware/validate"); 
const { isProduction } = require("../config/env"); 
const { MAX_ITEM_QUANTITY, MAX_LINE_ITEMS } = require("../config/constants"); 
 
const router = express.Router(); 
 
// This route is public (guests have carts too) and reads the 
// database, so it is rate limited per IP. 
const quoteLimiter = rateLimit({ 
  windowMs: 60 * 1000, 
  limit: isProduction ? 60 : 300, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { success: false, message: "Too many requests. Please slow down." }, 
}); 
 
// Rejects arrays and objects (like {"$gt": ""}) before other rules. 
const isPlainValue = (value) => 
  typeof value === "string" || typeof value === "number"; 
 
const quoteRules = [ 
  body("items") 
    .isArray({ max: MAX_LINE_ITEMS }) 
    .withMessage(`items must be a list of at most ${MAX_LINE_ITEMS} products.`), 
  body("items.*.productId") 
    .isString() 
    .withMessage("Each item needs a valid productId.") 
    .bail() 
    .isMongoId() 
    .withMessage("Each item needs a valid productId."), 
  body("items.*.quantity") 
    .custom(isPlainValue) 
    .withMessage("Quantity must be a whole number.") 
    .bail() 
    .isInt({ min: 1, max: MAX_ITEM_QUANTITY }) 
    .withMessage(`Quantity must be a whole number from 1 to ${MAX_ITEM_QUANTITY}.`) 
    .bail() 
    .toInt(), 
]; 
 
// Mounted at /api/cart 
router.post("/quote", quoteLimiter, quoteRules, validate, quoteCart); 
 
module.exports = router;