const { body, param, query, header } = require("express-validator"); 
const { 
  ORDER_STATUSES, 
  ENABLED_PAYMENT_METHODS, 
  PAYMENT_METHODS, 
  PAYMENT_STATUSES, 
  MAX_ITEM_QUANTITY, 
  MAX_LINE_ITEMS, 
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
 
function choiceQuery(name, choices) { 
  return query(name) 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage(`${name} must be text.`) 
    .bail() 
    .isIn(choices) 
    .withMessage(`${name} must be one of: ${choices.join(", ")}.`); 
} 
 
const orderIdRule = param("id").isMongoId().withMessage("Invalid order ID."); 
 
const pagingRules = [ 
  integerQuery("page", 1, 100000), 
  integerQuery("limit", 1, MAX_PAGE_SIZE), 
]; 
 
const myOrdersRules = pagingRules; 
 
const adminOrdersRules = [ 
  ...pagingRules, 
  choiceQuery("status", ORDER_STATUSES), 
  choiceQuery("paymentMethod", PAYMENT_METHODS), 
  choiceQuery("paymentStatus", PAYMENT_STATUSES), 
]; 
 
const statusRules = [ 
  body("status") 
    .exists({ values: "null" }) 
    .withMessage("Status is required.") 
    .bail() 
    .isString() 
    .withMessage("Status must be text.") 
    .bail() 
    .isIn(ORDER_STATUSES) 
    .withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}.`), 
]; 
 
const paymentStatusRules = [ 
  body("paymentStatus") 
    .exists({ values: "null" }) 
    .withMessage("Payment status is required.") 
    .bail() 
    .isString() 
    .withMessage("Payment status must be text.") 
    .bail() 
    .isIn(PAYMENT_STATUSES) 
    .withMessage( 
      `Payment status must be one of: ${PAYMENT_STATUSES.join(", ")}.` 
    ), 
]; 
 
function addressField(field, label, max) { 
  return body(`shippingAddress.${field}`) 
    .isString() 
    .withMessage(`${label} is required.`) 
    .bail() 
    .trim() 
    .isLength({ min: 1, max }) 
    .withMessage(`${label} must be 1 to ${max} characters.`); 
} 
 
// Note: there is NO price field and NO payment status field here on 
// purpose. Prices and payment status are never accepted from the browser. 
const createOrderRules = [ 
  header("idempotency-key") 
    .isString() 
    .withMessage("A valid Idempotency-Key header is required.") 
    .bail() 
    .matches(/^[A-Za-z0-9_-]{8,100}$/) 
    .withMessage("A valid Idempotency-Key header is required."), 
  body("items") 
    .isArray({ min: 1, max: MAX_LINE_ITEMS }) 
    .withMessage(`items must be a list of 1 to ${MAX_LINE_ITEMS} products.`), 
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
  body("shippingAddress") 
    .isObject() 
    .withMessage("shippingAddress is required."), 
  addressField("fullName", "Full name", 100), 
  addressField("address", "Address", 200), 
  addressField("city", "City", 100), 
  addressField("postalCode", "Postal code", 20), 
  addressField("country", "Country", 100), 
  body("shippingAddress.phone") 
    .isString() 
    .withMessage("Phone is required.") 
    .bail() 
    .trim() 
    .matches(/^[0-9+\-\s]{7,15}$/) 
    .withMessage("Enter a valid phone number (7-15 digits)."), 
  body("paymentMethod") 
    .exists({ values: "null" }) 
    .withMessage("Choose a payment method.") 
    .bail() 
    .isString() 
    .withMessage("Payment method must be text.") 
    .bail() 
    .isIn(ENABLED_PAYMENT_METHODS) 
    .withMessage( 
      `Payment method must be one of: ${ENABLED_PAYMENT_METHODS.join(", ")}.` 
    ), 
]; 
 
module.exports = { 
  orderIdRule, 
  myOrdersRules, 
  adminOrdersRules, 
  statusRules, 
  paymentStatusRules, 
  createOrderRules, 
};