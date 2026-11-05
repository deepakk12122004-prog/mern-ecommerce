const express = require("express"); 
const healthRoutes = require("./healthRoutes"); 
const authRoutes = require("./authRoutes"); 
const adminRoutes = require("./adminRoutes"); 
const productRoutes = require("./productRoutes"); 
const cartRoutes = require("./cartRoutes"); 
const orderRoutes = require("./orderRoutes"); 
const paymentRoutes = require("./paymentRoutes"); 
const router = express.Router(); 
// Every route group is mounted here. app.js puts them all under /api. 
router.use("/health", healthRoutes); 
router.use("/auth", authRoutes); 
router.use("/admin", adminRoutes); 
router.use("/products", productRoutes); 
router.use("/cart", cartRoutes); 
router.use("/orders", orderRoutes); 
router.use("/payments", paymentRoutes); 
module.exports = router;