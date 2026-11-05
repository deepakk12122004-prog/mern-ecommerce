const { body, param, query } = require("express-validator"); 
const { 
  PAYMENT_ATTEMPT_STATUSES, 
  MAX_PAGE_SIZE, 
} = require("../config/constants"); 
 
// Rejects arrays and objects (like {"$gt": 0}) before other rules. 
const isPlainValue = (value) => 
  typeof value === "string" || typeof value === "number"; 
 
function integerQuery(name, min, max) { 
  return query(name) 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage(`${name} must be a whole number.`) 
    .bail() 
    .isInt({ min, max }) 
    .withMessage(`${name} must be a whole number from ${min} to ${max}.`) 
    .bail() 
    .toInt(); 
} 
 
const orderIdRule = body("orderId") 
  .isString() 
  .withMessage("A valid orderId is required.") 
  .bail() 
  .isMongoId() 
  .withMessage("A valid orderId is required."); 
 
// Razorpay ids look like "order_IluGWxBm9U8zJ8" and "pay_IH4NVgf4Dreq1l" 
const razorpayOrderIdRule = body("razorpayOrderId") 
  .isString() 
  .withMessage("razorpayOrderId is required.") 
  .bail() 
  .matches(/^order_[A-Za-z0-9]{6,40}$/) 
  .withMessage("razorpayOrderId is not valid."); 
 
const razorpayPaymentIdRule = body("razorpayPaymentId") 
  .isString() 
  .withMessage("razorpayPaymentId is required.") 
  .bail() 
  .matches(/^pay_[A-Za-z0-9]{6,40}$/) 
  .withMessage("razorpayPaymentId is not valid."); 
 
// The signature is a 64-character hexadecimal text 
const signatureRule = body("razorpaySignature") 
  .isString() 
  .withMessage("razorpaySignature is required.") 
  .bail() 
  .matches(/^[A-Fa-f0-9]{64}$/) 
  .withMessage("razorpaySignature is not valid."); 
 
// Note: there is NO amount field here on purpose. 
// The amount always comes from the order saved in MongoDB. 
const createRazorpayOrderRules = [orderIdRule]; 
 
const verifyPaymentRules = [ 
  orderIdRule, 
  razorpayOrderIdRule, 
  razorpayPaymentIdRule, 
  signatureRule, 
]; 
 
const paymentFailureRules = [ 
  orderIdRule, 
  razorpayOrderIdRule, 
  body("reason") 
    .isString() 
    .withMessage('reason must be "failed" or "cancelled".') 
    .bail() 
    .isIn(["failed", "cancelled"]) 
    .withMessage('reason must be "failed" or "cancelled".'), 
  body("error").optional().isObject().withMessage("error must be an object."), 
]; 
 
// ---- Admin ---- 
const paymentIdRule = param("id").isMongoId().withMessage("Invalid payment ID."); 
 
const adminPaymentsRules = [ 
  query("status") 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage("status must be text.") 
    .bail() 
    .isIn(PAYMENT_ATTEMPT_STATUSES) 
    .withMessage(`status must be one of: ${PAYMENT_ATTEMPT_STATUSES.join(", ")}.`), 
  query("refund") 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage("refund must be text.") 
    .bail() 
    .isIn(["needed"]) 
    .withMessage('refund must be "needed".'), 
  integerQuery("page", 1, 100000), 
  integerQuery("limit", 1, MAX_PAGE_SIZE), 
]; 
 
module.exports = { 
  createRazorpayOrderRules, 
  verifyPaymentRules, 
  paymentFailureRules, 
  paymentIdRule, 
  adminPaymentsRules, 
}; 