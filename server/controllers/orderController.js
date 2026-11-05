const { matchedData } = require("express-validator"); 
const Order = require("../models/Order"); 
const Product = require("../models/Product"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { runInTransaction } = require("../utils/withTransaction"); 
const { calculatePrices } = require("../utils/pricing"); 
const { MAX_ITEM_QUANTITY } = require("../config/constants"); 
 
const ORDER_PAGE_SIZE = 10; 
 
function pagination(page, limit, total) { 
  const totalPages = Math.ceil(total / limit); 
  return { 
    page, 
    limit, 
    total, 
    totalPages, 
    hasNextPage: page < totalPages, 
    hasPrevPage: page > 1, 
  }; 
} 
 
// Puts stock back (used when we must undo our own work). 
async function restoreStock(lines) { 
  for (const line of lines) { 
    try { 
      await Product.updateOne( 
        { _id: line.product }, 
        { $inc: { stock: line.quantity } } 
      ); 
    } catch (err) { 
      console.error(`Could not restore stock for ${line.product}:`, err); 
    } 
  } 
} 
 
// The whole "place an order" job: 
//   1. read the REAL products from the database 
//   2. check everything and collect all problems 
//   3. take the stock (one safe update per product) 
//   4. save the order, with purchase-time prices 
// With a session, any failure rolls everything back automatically. 
// Without one (no transactions), we undo our own stock changes. 
async function reserveAndCreate(input, session) { 
  const { userId, wanted, address, paymentMethod, idempotencyKey } = input; 
  const reserved = []; // lines whose stock we have already reduced 
 
  try { 
    const products = await Product.find({ _id: { $in: [...wanted.keys()] } }) 
      .select("name price stock isActive image") 
      .session(session) 
      .lean(); 
    const byId = new Map(products.map((p) => [String(p._id), p])); 
 
    // ---- 2. Check everything and collect ALL problems ---- 
    const problems = []; 
    wanted.forEach((quantity, productId) => { 
      const product = byId.get(productId); 
      if (!product || !product.isActive) { 
        problems.push({ 
          productId, 
          name: null, 
          message: "This product is no longer available.", 
        }); 
      } else if (product.stock < quantity) { 
        problems.push({ 
          productId, 
          name: product.name, 
          message: 
            product.stock < 1 
              ? "Out of stock." 
              : `Only ${product.stock} left.`, 
        }); 
      } 
    }); 
 
    if (problems.length > 0) { 
      const error = new AppError( 
        "Some items are no longer available in the quantity you asked for.", 
        409 
      ); 
      error.details = problems; 
      throw error; 
    } 
 
    // ---- Price everything from the DATABASE records ---- 
    let cents = 0; // whole cents, so decimals never drift 
    const items = []; 
    wanted.forEach((quantity, productId) => { 
      const product = byId.get(productId); 
      cents += Math.round(product.price * 100) * quantity; 
      items.push({ 
        product: product._id, 
        name: product.name, // purchase-time snapshot 
        price: product.price, // purchase-time snapshot 
        image: (product.image && product.image.url) || "", 
        quantity, 
      }); 
    }); 
    const prices = calculatePrices(cents / 100); 
 
    // ---- 3. Take the stock ---- 
    // "stock: { $gte: quantity }" means the database itself refuses to 
    // go below zero, even if another order arrives at the same moment. 
    // A fixed order (by id) also reduces clashes between orders. 
    const byProductId = [...items].sort((a, b) => 
      String(a.product).localeCompare(String(b.product)) 
    ); 
 
    for (const item of byProductId) { 
      const result = await Product.updateOne( 
        { 
          _id: item.product, 
          isActive: true, 
          stock: { $gte: item.quantity }, 
        }, 
        { $inc: { stock: -item.quantity } }, 
        { session } 
      ); 
 
      if (result.modifiedCount !== 1) { 
        const error = new AppError( 
          "Some items just sold out or have less stock than you asked for.", 
          409 
        ); 
        error.details = [ 
          { 
            productId: String(item.product), 
            name: item.name, 
            message: "Not enough stock.", 
          }, 
        ]; 
        throw error; 
      } 
      reserved.push(item); 
    } 
 
    // ---- 4. Save the order ---- 
    // paymentStatus is ALWAYS "pending" at the start. Only the server 
    // changes it later. 
    const [order] = await Order.create( 
      [ 
        { 
          user: userId, 
          items, 
          shippingAddress: address, 
          paymentMethod, 
          paymentStatus: "pending", 
          ...prices, 
          idempotencyKey, 
        }, 
      ], 
      { session } 
    ); 
 
    return order; 
  } catch (err) { 
    // Without a transaction nothing is rolled back for us 
    if (!session) await restoreStock(reserved); 
    throw err; 
  } 
} 
 
// POST /api/orders   (logged in) 
// Header: Idempotency-Key 
// Body: { items: [{ productId, quantity }], shippingAddress, paymentMethod } 
const createOrder = asyncHandler(async (req, res) => { 
  const idempotencyKey = req.get("Idempotency-Key"); 
 
  // Already placed with this key? Send back that order. No second order. 
  const existing = await Order.findOne({ 
    user: req.user._id, 
    idempotencyKey, 
  }); 
  if (existing) { 
    return res 
      .status(200) 
      .json({ success: true, duplicate: true, data: existing }); 
  } 
 
  // Copy ONLY productId and quantity (never a price). The same product 
  // listed twice is merged into one line. 
  const wanted = new Map(); 
  req.body.items.forEach((item) => { 
    const productId = String(item.productId); 
    const total = (wanted.get(productId) || 0) + Number(item.quantity); 
    wanted.set(productId, total); 
  }); 
  for (const quantity of wanted.values()) { 
    if (quantity > MAX_ITEM_QUANTITY) { 
      throw new AppError( 
        `You can order at most ${MAX_ITEM_QUANTITY} of one product.`, 
        400 
      ); 
    } 
  } 
 
  // Copy ONLY the address fields we know 
  const source = req.body.shippingAddress; 
  const address = { 
    fullName: String(source.fullName).trim(), 
    address: String(source.address).trim(), 
    city: String(source.city).trim(), 
    postalCode: String(source.postalCode).trim(), 
    country: String(source.country).trim(), 
    phone: String(source.phone).trim(), 
  }; 
 
  const input = { 
    userId: req.user._id, 
    wanted, 
    address, 
    paymentMethod: req.body.paymentMethod, // already checked by the rules 
    idempotencyKey, 
  }; 
 
  let order; 
  try { 
    order = await runInTransaction((session) => 
      reserveAndCreate(input, session) 
    ); 
  } catch (err) { 
    // Two identical requests at the same moment: the database accepted 
    // one and rejected the other (and rolled its stock change back). 
    if (err && err.code === 11000) { 
      const winner = await Order.findOne({ 
        user: req.user._id, 
        idempotencyKey, 
      }); 
      if (winner) { 
        return res 
          .status(200) 
          .json({ success: true, duplicate: true, data: winner }); 
      } 
    } 
    throw err; 
  } 
 
  res.status(201).json({ success: true, data: order }); 
}); 
 
// GET /api/orders   (logged in) - the user's own orders, newest first 
const getMyOrders = asyncHandler(async (req, res) => { 
  const q = matchedData(req, { locations: ["query"] }); 
  const page = q.page || 1; 
  const limit = q.limit || ORDER_PAGE_SIZE; 
  const filter = { user: req.user._id }; 
 
  const [orders, total] = await Promise.all([ 
    Order.find(filter) 
      .sort({ createdAt: -1, _id: -1 }) 
      .skip((page - 1) * limit) 
      .limit(limit), 
    Order.countDocuments(filter), 
  ]); 
 
  res.status(200).json({ 
    success: true, 
    data: orders, 
    pagination: pagination(page, limit, total), 
  }); 
}); 
 
// GET /api/orders/:id   (the owner, or an admin) 
const getOrder = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  const order = await Order.findById(id); 
  const isOwner = order && String(order.user) === String(req.user._id); 
  const isAdmin = req.user.role === "admin"; 
 
  // Someone else's order looks exactly like a missing one 
  if (!order || (!isOwner && !isAdmin)) { 
    throw new AppError("Order not found.", 404); 
  } 
 
  if (!isOwner) await order.populate("user", "name email"); 
 
  res.status(200).json({ success: true, data: order }); 
}); 
 
// GET /api/admin/orders?status=&paymentMethod=&paymentStatus=&page=&limit= 
// (admin only) 
const adminListOrders = asyncHandler(async (req, res) => { 
  const q = matchedData(req, { locations: ["query"] }); 
  const page = q.page || 1; 
  const limit = q.limit || ORDER_PAGE_SIZE; 
 
  // Each value is guaranteed to be one of our known names 
  const filter = {}; 
  if (q.status) filter.status = q.status; 
  if (q.paymentMethod) filter.paymentMethod = q.paymentMethod; 
  if (q.paymentStatus) filter.paymentStatus = q.paymentStatus; 
 
  const [orders, total] = await Promise.all([ 
    Order.find(filter) 
      .sort({ createdAt: -1, _id: -1 }) 
      .skip((page - 1) * limit) 
      .limit(limit) 
      .populate("user", "name email"), 
    Order.countDocuments(filter), 
  ]); 
 
  res.status(200).json({ 
    success: true, 
    data: orders, 
    pagination: pagination(page, limit, total), 
  }); 
}); 
 
// Changes the order status. For "cancelled" it also puts the stock 
// back and settles a payment that was still pending. 
async function applyStatusChange(order, newStatus, session) { 
  const changes = { status: newStatus }; 
  if (newStatus === "cancelled" && order.paymentStatus === "pending") { 
    changes.paymentStatus = "cancelled"; // nothing will be collected 
  } 
 
  // Only works if the order is STILL as we read it. If another admin 
  // changed the status or the payment a moment ago, this finds nothing 
  // (and stock is not restored twice). 
  const updated = await Order.findOneAndUpdate( 
    { 
      _id: order._id, 
      status: order.status, 
      paymentStatus: order.paymentStatus, 
    }, 
    changes, 
    { new: true, session } 
  ); 
  if (!updated) return null; 
 
  if (newStatus === "cancelled") { 
    for (const item of order.items) { 
      await Product.updateOne( 
        { _id: item.product }, 
        { $inc: { stock: item.quantity } }, 
        { session } 
      ); 
    } 
  } 
  // Without transactions this is best effort: the status is already saved. 
  return updated; 
} 
 
// PUT /api/admin/orders/:id/status   (admin only)   Body: { status } 
const adminUpdateOrderStatus = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
  const { status } = matchedData(req, { locations: ["body"] }); 
 
  const order = await Order.findById(id); 
  if (!order) throw new AppError("Order not found.", 404); 
 
  if (status === order.status) { 
    throw new AppError(`The order is already ${status}.`, 409); 
  } 
  if (!order.canChangeStatusTo(status)) { 
    throw new AppError( 
      `An order that is ${order.status} cannot be changed to ${status}.`, 
      409 
    ); 
  } 
 
  const updated = await runInTransaction((session) => 
    applyStatusChange(order, status, session) 
  ); 
  if (!updated) { 
    throw new AppError( 
      "This order was changed by someone else. Reload and try again.", 
      409 
    ); 
  } 
 
  res.status(200).json({ success: true, data: updated }); 
}); 
 
// PUT /api/admin/orders/:id/payment-status   (admin only) 
// Body: { paymentStatus } 
const adminUpdatePaymentStatus = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
  const { paymentStatus } = matchedData(req, { locations: ["body"] }); 
 
  const order = await Order.findById(id); 
  if (!order) throw new AppError("Order not found.", 404); 
 
  if (paymentStatus === order.paymentStatus) { 
    throw new AppError(`The payment is already ${paymentStatus}.`, 409); 
  } 
  if (!order.canChangePaymentStatusTo(paymentStatus)) { 
    throw new AppError( 
      `A payment that is ${order.paymentStatus} ` + 
        `cannot be changed to ${paymentStatus}.`, 
      409 
    ); 
  } 
 
  // Online payments are confirmed only by the payment gateway (with a 
  // verified signature). An admin may only record a refund for them. 
  if (order.paymentMethod !== "COD" && paymentStatus !== "refunded") { 
    throw new AppError( 
      "Online payments are confirmed automatically by the payment " + 
        "gateway. Only a refund can be recorded by hand.", 
      409 
    ); 
  } 
 
  if (order.status === "cancelled" && paymentStatus === "paid") { 
    throw new AppError("A cancelled order cannot be marked as paid.", 409); 
  } 
 
  const changes = { paymentStatus }; 
  if (paymentStatus === "paid") changes.paidAt = new Date(); 
 
  // Only works if the payment is STILL as we read it 
  const updated = await Order.findOneAndUpdate( 
    { _id: order._id, paymentStatus: order.paymentStatus }, 
    changes, 
    { new: true } 
  ); 
  if (!updated) { 
    throw new AppError( 
      "This payment was changed by someone else. Reload and try again.", 
      409 
    ); 
  } 
 
  res.status(200).json({ success: true, data: updated }); 
}); 
 
module.exports = { 
  createOrder, 
  getMyOrders, 
  getOrder, 
  adminListOrders, 
  adminUpdateOrderStatus, 
  adminUpdatePaymentStatus, 
};