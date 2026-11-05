const { query } = require("express-validator"); 
const { 
  ADMIN_PRODUCT_SORT_KEYS, 
  ADMIN_STOCK_FILTERS, 
  ADMIN_PRODUCT_STATUS_FILTERS, 
  MAX_PAGE_SIZE, 
} = require("../config/constants"); 
 
// Rejects arrays and objects (like {"$gt": 0}) before other rules. 
const isPlainValue = (value) => 
  typeof value === "string" || typeof value === "number"; 
 
function textQuery(name, max) { 
  return query(name) 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage(`${name} must be text.`) 
    .bail() 
    .trim() 
    .isLength({ max }) 
    .withMessage(`${name} can be at most ${max} characters.`); 
} 
 
function choiceQuery(name, choices) { 
  return query(name) 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage(`${name} must be a single value.`) 
    .bail() 
    .isIn(choices) 
    .withMessage(`${name} must be one of: ${choices.join(", ")}.`); 
} 
 
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
 
const adminProductsRules = [ 
  textQuery("search", 100), 
  textQuery("category", 50), 
  choiceQuery("status", ADMIN_PRODUCT_STATUS_FILTERS), 
  choiceQuery("stock", ADMIN_STOCK_FILTERS), 
  choiceQuery("sort", ADMIN_PRODUCT_SORT_KEYS), 
  integerQuery("page", 1, 100000), 
  integerQuery("limit", 1, MAX_PAGE_SIZE), 
]; 
 
module.exports = { adminProductsRules };  