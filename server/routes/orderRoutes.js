const express = require("express"); 
const rateLimit = require("express-rate-limit"); 
 
const { 
  createOrder, 
  getMyOrders, 
  getOrder, 
} = require("../controllers/orderController"); 
const { protect } = require("../middleware/auth"); 
const validate = require("../middleware/validate"); 
const { isProduction } = require("../config/env"); 
const { 
orderIdRule, 
myOrdersRules, 
createOrderRules, 
} = require("../validators/orderValidators"); 
const router = express.Router(); 
// Placing orders is limited per IP (a safety net against abuse) 
const orderLimiter = rateLimit({ 
windowMs: 15 * 60 * 1000, 
limit: isProduction ? 30 : 300, 
standardHeaders: true, 
legacyHeaders: false, 
message: { 
success: false, 
message: "Too many order attempts. Please try again later.", 
}, 
}); 
// Every order route needs a logged-in user (401 otherwise). 
router.use(protect); 
// Mounted at /api/orders 
router.post("/", orderLimiter, createOrderRules, validate, createOrder); 
router.get("/", myOrdersRules, validate, getMyOrders); 
router.get("/:id", orderIdRule, validate, getOrder); 
module.exports = router;