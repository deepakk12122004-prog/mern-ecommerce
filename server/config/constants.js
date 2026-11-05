// Shared lists and limits, so the models and the 
// controllers always agree with each other. 
const { isRazorpayConfigured } = require("./env"); 
 
const USER_ROLES = ["user", "admin"]; 
const ORDER_STATUSES = [ 
"pending", 
"processing", 
"shipped", 
"delivered", 
"cancelled", 
]; 
// Which status can follow which. Used by the admin 
// "update order status" feature. 
const ORDER_STATUS_FLOW = { 
pending: ["processing", "cancelled"], 
processing: ["shipped", "cancelled"], 
shipped: ["delivered"], 
delivered: [], 
cancelled: [], 
}; 
// ---- Payments ---- 
// Every method the system knows about 
const PAYMENT_METHODS = ["COD", "UPI"]; 
// The methods customers can choose RIGHT NOW. UPI needs the Razorpay 
// keys in server/.env, so without them only Cash on Delivery works. 
const ENABLED_PAYMENT_METHODS = isRazorpayConfigured 
? [...PAYMENT_METHODS] 
: ["COD"]; 
// pending   - not paid yet (COD: cash not collected yet) 
// paid      - money received 
// failed    - the payment did not happen 
// refunded  - money was paid, then returned 
// cancelled - the order was cancelled before any payment 
const PAYMENT_STATUSES = [ 
"pending", 
"paid", 
"failed", 
"refunded", 
"cancelled", 
]; 
// Which payment status can follow which. ("cancelled" is only set 
// automatically when an order is cancelled.) 
const PAYMENT_STATUS_FLOW = { 
pending: ["paid", "failed"], 
paid: ["refunded"], 
failed: [], 
refunded: [], 
cancelled: [], 
}; 
// One Razorpay payment attempt (see models/Payment.js): 
// created   - waiting for the customer to pay 
// paid      - the payment signature was verified by the server 
// failed    - the last attempt failed (reported by the browser) 
// cancelled - the customer closed the payment window 
const PAYMENT_ATTEMPT_STATUSES = ["created", "paid", "failed", "cancelled"]; 
const MAX_ITEM_QUANTITY = 99; // per product, per cart or order 
const MAX_LINE_ITEMS = 50; // different products per cart or order 
// ---- Product list rules ---- 
// The ONLY sort orders a visitor may ask for. 
const PRODUCT_SORT_KEYS = [ 
"newest", 
"oldest", 
"price_asc", 
"price_desc", 
"name_asc", 
"name_desc", 
]; 
const DEFAULT_PAGE_SIZE = 12; 
const MAX_PAGE_SIZE = 50; 
// ---- Product images ---- 
// SVG is left out on purpose: SVG files can contain scripts. 
const MAX_IMAGE_MB = 5; 
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]; 
// ---- Admin inventory ---- 
// 1 to this many items in stock counts as "low stock". 
// (The frontend ProductCard uses the same number.) 
const LOW_STOCK_THRESHOLD = 5; 
const ADMIN_PRODUCT_SORT_KEYS = [ 
"newest", 
"oldest", 
"name_asc", 
"name_desc", 
"price_asc", 
"price_desc", 
"stock_asc", 
"stock_desc", 
]; 
const ADMIN_STOCK_FILTERS = ["all", "ok", "low", "out"]; 
const ADMIN_PRODUCT_STATUS_FILTERS = ["all", "active", "hidden"]; 
 
module.exports = { 
  USER_ROLES, 
  ORDER_STATUSES, 
  ORDER_STATUS_FLOW, 
  PAYMENT_METHODS, 
  ENABLED_PAYMENT_METHODS, 
  PAYMENT_STATUSES, 
  PAYMENT_STATUS_FLOW, 
  PAYMENT_ATTEMPT_STATUSES, 
  MAX_ITEM_QUANTITY, 
  MAX_LINE_ITEMS, 
  PRODUCT_SORT_KEYS, 
  DEFAULT_PAGE_SIZE, 
  MAX_PAGE_SIZE, 
  MAX_IMAGE_MB, 
  ALLOWED_IMAGE_TYPES, 
  LOW_STOCK_THRESHOLD, 
  ADMIN_PRODUCT_SORT_KEYS, 
  ADMIN_STOCK_FILTERS, 
  ADMIN_PRODUCT_STATUS_FILTERS, 
}; 