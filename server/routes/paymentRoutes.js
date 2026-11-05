 
const express = require("express"); 
const rateLimit = require("express-rate-limit"); 
 
const { 
  getPaymentMethods, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  recordPaymentFailure, 
  razorpayWebhook, 
} = require("../controllers/paymentController"); 
const { protect } = require("../middleware/auth"); 
const validate = require("../middleware/validate"); 
const { isProduction } = require("../config/env"); 
const { 
  createRazorpayOrderRules, 
  verifyPaymentRules, 
  paymentFailureRules, 
} = require("../validators/paymentValidators"); 
 
const router = express.Router(); 
 
// Limits repeated payment calls per IP (a safety net against abuse) 
const paymentLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  limit: isProduction ? 60 : 300, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { 
    success: false, 
    message: "Too many payment requests. Please try again later.", 
  }, 
}); 
 
// A generous limit for Razorpay's webhook calls 
const webhookLimiter = rateLimit({ 
  windowMs: 60 * 1000, 
  limit: 120, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { success: false, message: "Too many webhook requests." }, 
}); 
 
// Mounted at /api/payments 
 
// Public: which methods can be used right now 
router.get("/methods", getPaymentMethods); 
 
// Called by Razorpay's servers. No login: the SIGNATURE is the proof. 
router.post("/razorpay/webhook", webhookLimiter, razorpayWebhook); 
 
// Everything below needs a logged-in user (401 otherwise) 
router.use(protect); 
 
router.post( 
  "/razorpay/order", 
  paymentLimiter, 
  createRazorpayOrderRules, 
  validate, 
  createRazorpayOrder 
); 
router.post( 
  "/razorpay/verify", 
  paymentLimiter, 
  verifyPaymentRules, 
  validate, 
  verifyRazorpayPayment 
); 
router.post( 
  "/razorpay/failure", 
  paymentLimiter, 
  paymentFailureRules, 
  validate, 
  recordPaymentFailure 
); 
 
module.exports = router;