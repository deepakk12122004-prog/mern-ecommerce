const { matchedData } = require("express-validator"); 
const User = require("../models/User"); 
const Product = require("../models/Product"); 
const Order = require("../models/Order"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { roundMoney } = require("../utils/validators"); 
const { ORDER_STATUSES, LOW_STOCK_THRESHOLD } = require("../config/constants"); 
 
const DAY_MS = 24 * 60 * 60 * 1000; 
const ADMIN_PAGE_SIZE = 10; 
 
// Makes text safe to use inside a regular expression 
function escapeRegex(text) { 
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); 
} 
 
// Each sort name maps to a fixed MongoDB sort. The browser never 
// supplies a MongoDB sort object. Keep the names in sync with 
// ADMIN_PRODUCT_SORT_KEYS in constants.js. 
const ADMIN_SORTS = { 
  newest: { createdAt: -1, _id: -1 }, 
  oldest: { createdAt: 1, _id: 1 }, 
  name_asc: { name: 1, _id: 1 }, 
  name_desc: { name: -1, _id: 1 }, 
  price_asc: { price: 1, _id: 1 }, 
  price_desc: { price: -1, _id: 1 }, 
  stock_asc: { stock: 1, name: 1, _id: 1 }, 
  stock_desc: { stock: -1, name: 1, _id: 1 }, 
}; 
 
// GET /api/admin/users   (kept from the auth stage) 
// Password hashes are never selected from the database. 
const getUsers = asyncHandler(async (req, res) => { 
  const users = await User.find().sort({ createdAt: -1 }).limit(200); 
  res.status(200).json({ success: true, data: users }); 
}); 
 
// GET /api/admin/stats 
// Numbers for the dashboard overview. 
const getStats = asyncHandler(async (req, res) => { 
  const weekAgo = new Date(Date.now() - 7 * DAY_MS); 
 
  const lowStockFilter = { 
    isActive: true, 
    stock: { $gte: 1, $lte: LOW_STOCK_THRESHOLD }, 
  }; 
  const outOfStockFilter = { isActive: true, stock: 0 }; 
 
  const [ 
    totalUsers, 
    adminUsers, 
    newUsers, 
    recentUsers, 
    totalProducts, 
    activeProducts, 
    lowStockCount, 
    outOfStockCount, 
    inventoryRows, 
    lowStockList, 
    totalOrders, 
    recentOrderCount, 
    statusRows, 
    salesRows, 
    recentOrders, 
  ] = await Promise.all([ 
    User.countDocuments(), 
    User.countDocuments({ role: "admin" }), 
    User.countDocuments({ createdAt: { $gte: weekAgo } }), 
    User.find().sort({ createdAt: -1 }).limit(5), 
 
    Product.countDocuments(), 
    Product.countDocuments({ isActive: true }), 
    Product.countDocuments(lowStockFilter), 
    Product.countDocuments(outOfStockFilter), 
    // Units and money value of the stock on visible products 
    Product.aggregate([ 
      { $match: { isActive: true } }, 
      { 
        $group: { 
          _id: null, 
          units: { $sum: "$stock" }, 
          value: { $sum: { $multiply: ["$price", "$stock"] } }, 
        }, 
      }, 
    ]), 
    Product.find({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } }) 
      .sort({ stock: 1, name: 1 }) 
      .limit(8) 
      .select("name category stock price image"), 
 
    Order.countDocuments(), 
    Order.countDocuments({ createdAt: { $gte: weekAgo } }), 
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]), 
    // Sales = everything except cancelled orders 
    Order.aggregate([ 
      { $match: { status: { $ne: "cancelled" } } }, 
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }, 
    ]), 
    Order.find() 
      .sort({ createdAt: -1 }) 
      .limit(5) 
      .populate("user", "name email"), 
  ]); 
 
  // Every status appears, even with a count of 0 
  const byStatus = {}; 
  ORDER_STATUSES.forEach((status) => { 
    byStatus[status] = 0; 
  }); 
  statusRows.forEach((row) => { 
    if (row._id in byStatus) byStatus[row._id] = row.count; 
  }); 
 
  const inventory = inventoryRows[0] || { units: 0, value: 0 }; 
  const sales = salesRows[0] ? salesRows[0].total : 0; 
 
  res.status(200).json({ 
    success: true, 
    data: { 
      lowStockThreshold: LOW_STOCK_THRESHOLD, 
      users: { 
        total: totalUsers, 
        admins: adminUsers, 
        newLast7Days: newUsers, 
        recent: recentUsers, 
      }, 
      products: { 
        total: totalProducts, 
        active: activeProducts, 
        hidden: totalProducts - activeProducts, 
        lowStock: lowStockCount, 
        outOfStock: outOfStockCount, 
        inventoryUnits: inventory.units, 
        inventoryValue: roundMoney(inventory.value), 
        lowStockList, 
      }, 
      orders: { 
        total: totalOrders, 
        last7Days: recentOrderCount, 
        byStatus, 
        sales: roundMoney(sales), 
        recent: recentOrders, 
      }, 
    }, 
  }); 
}); 
 
// GET /api/admin/products 
// Query: search, category, status (all|active|hidden), 
//        stock (all|ok|low|out), sort, page, limit 
// Unlike the public list, this includes hidden products. 
const adminListProducts = asyncHandler(async (req, res) => { 
  const q = matchedData(req, { locations: ["query"] }); 
  const page = q.page || 1; 
  const limit = q.limit || ADMIN_PAGE_SIZE; 
  const sortKey = q.sort || "newest"; 
 
  // The filter is built here, one safe piece at a time. 
  const filter = {}; 
 
  if (q.status === "active") filter.isActive = true; 
  if (q.status === "hidden") filter.isActive = false; 
 
  if (q.stock === "out") filter.stock = 0; 
  if (q.stock === "low") { 
    filter.stock = { $gte: 1, $lte: LOW_STOCK_THRESHOLD }; 
  } 
  if (q.stock === "ok") filter.stock = { $gt: LOW_STOCK_THRESHOLD }; 
 
  if (q.category) filter.category = q.category; 
 
  if (q.search) { 
    const pattern = new RegExp(escapeRegex(q.search), "i"); 
    filter.$or = [{ name: pattern }, { description: pattern }]; 
  } 
 
  const query = Product.find(filter) 
    .sort(ADMIN_SORTS[sortKey] || ADMIN_SORTS.newest) 
    .skip((page - 1) * limit) 
    .limit(limit) 
    .select("-__v") 
    .lean(); 
 
  if (sortKey.startsWith("name_")) { 
    query.collation({ locale: "en", strength: 2 }); 
  } 
 
  const [products, total] = await Promise.all([ 
    query, 
    Product.countDocuments(filter), 
  ]); 
 
  const totalPages = Math.ceil(total / limit); 
 
  res.status(200).json({ 
    success: true, 
    data: products, 
    lowStockThreshold: LOW_STOCK_THRESHOLD, 
    pagination: { 
      page, 
      limit, 
      total, 
      totalPages, 
      hasNextPage: page < totalPages, 
      hasPrevPage: page > 1, 
    }, 
  }); 
}); 
 
// GET /api/admin/orders/:id 
// One order with the customer's name and email. 
const adminGetOrder = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  const order = await Order.findById(id).populate("user", "name email"); 
  if (!order) throw new AppError("Order not found.", 404); 
 
  res.status(200).json({ success: true, data: order }); 
}); 
 
module.exports = { getUsers, getStats, adminListProducts, adminGetOrder };