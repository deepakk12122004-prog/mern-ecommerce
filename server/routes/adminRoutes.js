const express = require("express"); 
const { 
  getUsers, 
  getStats, 
  adminListProducts, 
  adminGetOrder, 
} = require("../controllers/adminController"); 
const { 
  adminListOrders, 
  adminUpdateOrderStatus, 
  adminUpdatePaymentStatus, 
} = require("../controllers/orderController"); 
const { 
  adminListPayments, 
  adminMarkRefundDone, 
} = require("../controllers/adminPaymentController"); 
const { protect } = require("../middleware/auth"); 
const { adminOnly } = require("../middleware/admin"); 
const validate = require("../middleware/validate"); 
const { 
orderIdRule, 
adminOrdersRules, 
statusRules, 
paymentStatusRules, 
} = require("../validators/orderValidators"); 
const { adminProductsRules } = require("../validators/adminValidators"); 
const { 
paymentIdRule, 
adminPaymentsRules, 
} = require("../validators/paymentValidators"); 
const router = express.Router(); 
// Every route below this line needs: logged in AND role "admin". 
// The role is read from the database on every request. 
router.use(protect, adminOnly); 
router.get("/stats", getStats); 
router.get("/users", getUsers); 
router.get("/products", adminProductsRules, validate, adminListProducts); 
router.get("/orders", adminOrdersRules, validate, adminListOrders); 
router.get("/orders/:id", orderIdRule, validate, adminGetOrder); 
router.put( 
"/orders/:id/status", 
orderIdRule, 
statusRules, 
validate, 
adminUpdateOrderStatus 
); 
router.put( 
"/orders/:id/payment-status", 
orderIdRule, 
paymentStatusRules, 
validate, 
adminUpdatePaymentStatus 
); 
router.get("/payments", adminPaymentsRules, validate, adminListPayments); 
router.put( 
"/payments/:id/refund-done", 
paymentIdRule, 
validate, 
adminMarkRefundDone 
); 
module.exports = router;