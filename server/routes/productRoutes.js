const express = require("express"); 
const { body, param, query } = require("express-validator"); 
 
const { 
  listProducts, 
  getCategories, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  uploadProductImage, 
  deleteProductImage, 
} = require("../controllers/productController"); 
const { protect, optionalAuth } = require("../middleware/auth"); 
const { adminOnly } = require("../middleware/admin"); 
const { uploadSingleImage } = require("../middleware/upload"); 
const validate = require("../middleware/validate"); 
const { hasAtMostTwoDecimals } = require("../utils/validators"); 
const { PRODUCT_SORT_KEYS, MAX_PAGE_SIZE } = require("../config/constants"); 
 
const router = express.Router(); 
 
// Accepts a string, number or boolean. Rejects arrays and objects 
// (like {"$gt": 0}) before any other rule looks at the value. 
const isPlainValue = (value) => 
  ["string", "number", "boolean"].includes(typeof value); 
 
// ---- Rules for the :id in the URL ---- 
const idRule = param("id").isMongoId().withMessage("Invalid product ID."); 
 
// ---- Rules for the list query (?search=...&page=...) ---- 
function numberQuery(name, min, max) { 
  return query(name) 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage(`${name} must be a number.`) 
    .bail() 
    .isFloat({ min, max }) 
    .withMessage(`${name} must be between ${min} and ${max}.`) 
    .bail() 
    .toFloat(); 
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
 
const listRules = [ 
  query("search") 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage("search must be text.") 
    .bail() 
    .trim() 
    .isLength({ max: 100 }) 
    .withMessage("search can be at most 100 characters."), 
  query("category") 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage("category must be text.") 
    .bail() 
    .trim() 
    .isLength({ max: 50 }) 
    .withMessage("category can be at most 50 characters."), 
  numberQuery("minPrice", 0, 1000000), 
  numberQuery("maxPrice", 0, 1000000), 
  query("sort") 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage("sort must be a single value.") 
    .bail() 
    .isIn(PRODUCT_SORT_KEYS) 
    .withMessage(`sort must be one of: ${PRODUCT_SORT_KEYS.join(", ")}.`), 
  integerQuery("page", 1, 100000), 
  integerQuery("limit", 1, MAX_PAGE_SIZE), 
  query("includeInactive") 
    .optional({ values: "falsy" }) 
    .custom(isPlainValue) 
    .withMessage("includeInactive must be true or false.") 
    .bail() 
    .isIn(["true", "false"]) 
    .withMessage("includeInactive must be true or false.") 
    .bail() 
    .toBoolean(), 
]; 
 
// ---- Rules for the request body (create and update) ---- 
// On create a field must be present. On update it may be left out. 
function field(name, label, required) { 
  const chain = body(name); 
  if (required) { 
    return chain 
      .exists({ values: "null" }) 
      .withMessage(`${label} is required.`) 
      .bail(); 
  } 
  return chain.optional(); 
} 
 
function productRules(required) { 
  return [ 
    field("name", "Name", required) 
      .isString() 
      .withMessage("Name must be text.") 
      .bail() 
      .trim() 
      .isLength({ min: 2, max: 120 }) 
      .withMessage("Name must be 2 to 120 characters."), 
    field("description", "Description", required) 
      .isString() 
      .withMessage("Description must be text.") 
      .bail() 
      .trim() 
      .isLength({ min: 1, max: 2000 }) 
      .withMessage("Description must be 1 to 2000 characters."), 
    field("price", "Price", required) 
      .custom(isPlainValue) 
      .withMessage("Price must be a number.") 
      .bail() 
      .isFloat({ min: 0.01, max: 1000000 }) 
      .withMessage("Price must be between 0.01 and 1000000.") 
      .bail() 
      .toFloat() 
      .custom(hasAtMostTwoDecimals) 
      .withMessage("Price can have at most 2 decimal places."), 
    field("category", "Category", required) 
      .isString() 
      .withMessage("Category must be text.") 
      .bail() 
      .trim() 
      .isLength({ min: 2, max: 50 }) 
      .withMessage("Category must be 2 to 50 characters."), 
    body("stock") 
      .optional() 
      .custom(isPlainValue) 
      .withMessage("Stock must be a whole number.") 
      .bail() 
      .isInt({ min: 0, max: 1000000 }) 
      .withMessage("Stock must be a whole number from 0 to 1000000.") 
      .bail() 
      .toInt(), 
    body("isActive") 
      .optional() 
      .custom(isPlainValue) 
      .withMessage("isActive must be true or false.") 
      .bail() 
      .isBoolean() 
      .withMessage("isActive must be true or false.") 
      .bail() 
      .toBoolean(), 
  ]; 
} 
 
// ---- Routes (mounted at /api/products) ---- 
// Order matters: "/categories" must come BEFORE "/:id", 
// otherwise Express would treat the word "categories" as an id. 
 
// Public 
router.get("/", optionalAuth, listRules, validate, listProducts); 
router.get("/categories", getCategories); 
router.get("/:id", optionalAuth, idRule, validate, getProduct); 
 
// Admin only: logged in first (401), then role check (403), 
// then validation (400) 
router.post( 
  "/", 
  protect, 
  adminOnly, 
  productRules(true), 
  validate, 
  createProduct 
); 
router.put( 
  "/:id", 
  protect, 
  adminOnly, 
  idRule, 
  productRules(false), 
  validate, 
updateProduct 
); 
router.delete("/:id", protect, adminOnly, idRule, validate, deleteProduct); 
// Product image (admin only). protect and adminOnly come BEFORE the 
// upload middleware, so only admins can make the server read a file. 
router.post( 
"/:id/image", 
protect, 
adminOnly, 
idRule, 
validate, 
...uploadSingleImage, 
uploadProductImage 
); 
router.delete( 
"/:id/image", 
protect, 
adminOnly, 
idRule, 
validate, 
deleteProductImage 
); 
module.exports = router;