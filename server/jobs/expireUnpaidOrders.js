 
const Order = require("../models/Order"); 
const Payment = require("../models/Payment"); 
const Product = require("../models/Product"); 
const { razorpay, isRazorpayConfigured } = require("../config/razorpay"); 
const { 
  UPI_PAYMENT_WINDOW_MINUTES, 
  EXPIRY_JOB_INTERVAL_MINUTES, 
} = require("../config/env"); 
const { runInTransaction } = require("../utils/withTransaction"); 
const { settlePayment } = require("../utils/settlePayment"); 
 
const BATCH_SIZE = 50; // orders looked at per run 
 
// Do not cancel an order if a payment attempt was touched this recently 
// (the customer may be in the middle of paying). 
const GRACE_MINUTES = 10; 
 
// Asks RAZORPAY whether a payment really went through for this order. 
// Returns { payment, paymentId } or null. Throws if Razorpay cannot be 
// reached (then the order is left alone and checked again later). 
async function findCapturedPayment(order) { 
  const payments = await Payment.find({ order: order._id }); 
 
  for (const payment of payments) { 
    const result = await razorpay.orders.fetchPayments(payment.razorpayOrderId); 
    const items = (result && result.items) || []; 
    const captured = items.find( 
      (p) => 
        p.status === "captured" && 
        p.amount === payment.amountPaise && 
        p.currency === "INR" 
    ); 
    if (captured) return { payment, paymentId: captured.id }; 
  } 
  return null; 
} 
 
// Cancels the order, puts the stock back, and closes its payment 
// records, all together (or not at all). 
async function cancelUnpaidOrder(order) { 
  return runInTransaction(async (session) => { 
    // Only if it is STILL an unpaid, untouched UPI order 
    const updated = await Order.findOneAndUpdate( 
      { 
        _id: order._id, 
        paymentMethod: "UPI", 
        paymentStatus: "pending", 
        status: "pending", 
      }, 
      { status: "cancelled", paymentStatus: "cancelled" }, 
      { new: true, session } 
    ); 
    if (!updated) return null; 
 
    for (const item of order.items) { 
      await Product.updateOne( 
        { _id: item.product }, 
        { $inc: { stock: item.quantity } }, 
        { session } 
      ); 
    } 
 
    await Payment.updateMany( 
      { order: order._id, status: { $ne: "paid" } }, 
      { status: "cancelled" }, 
      { session } 
    ); 
 
    return updated; 
  }); 
} 
 
// One pass over the unpaid UPI orders that are older than the window. 
//   windowMinutes - how old an unpaid order must be (default: the 
//                   UPI_PAYMENT_WINDOW_MINUTES setting) 
//   graceMinutes  - skip orders with very recent payment activity 
// Returns { checked, cancelled, paidInstead, skipped } 
async function expireUnpaidOrders({ 
  windowMinutes = UPI_PAYMENT_WINDOW_MINUTES, 
  graceMinutes = GRACE_MINUTES, 
} = {}) { 
  const summary = { checked: 0, cancelled: 0, paidInstead: 0, skipped: 0 }; 
 
  // Without the Razorpay keys we cannot check for late payments, 
  // so we never cancel anything. 
  if (!isRazorpayConfigured) return summary; 
 
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000); 
  const graceCutoff = new Date(Date.now() - graceMinutes * 60 * 1000); 
 
  const candidates = await Order.find({ 
    paymentMethod: "UPI", 
    paymentStatus: "pending", 
    status: "pending", 
    createdAt: { $lt: cutoff }, 
  }) 
    .sort({ createdAt: 1 }) 
    .limit(BATCH_SIZE); 
 
  summary.checked = candidates.length; 
 
  for (const order of candidates) { 
    try { 
      // Someone is paying right now? Leave it for the next run. 
      const busy = await Payment.exists({ 
        order: order._id, 
        updatedAt: { $gt: graceCutoff }, 
        status: { $ne: "paid" }, 
      }); 
      if (busy) { 
        summary.skipped += 1; 
        continue; 
      } 
 
      // 1. Did the customer actually pay? Then mark it paid. Do not cancel. 
      const found = await findCapturedPayment(order); 
      if (found) { 
        const result = await settlePayment(found.payment, found.paymentId); 
        if (result.outcome === "paid") summary.paidInstead += 1; 
        else summary.skipped += 1; 
        continue; 
      } 
 
      // 2. No payment: cancel and return the stock 
      const cancelled = await cancelUnpaidOrder(order); 
      if (cancelled) summary.cancelled += 1; 
      else summary.skipped += 1; 
    } catch (err) { 
      // For example Razorpay could not be reached: try again next run 
      summary.skipped += 1; 
      console.error(`Could not expire order ${order._id}:`, err.message); 
    } 
  } 
 
  return summary; 
} 
 
// ---- Scheduling ---- 
let timer = null; 
let running = false; 
 
async function runOnce() { 
  if (running) return; // never two runs at once 
  running = true; 
  try { 
    const s = await expireUnpaidOrders(); 
    if (s.checked > 0) { 
      console.log( 
        `Expiry job: checked ${s.checked}, cancelled ${s.cancelled}, ` + 
          `found paid ${s.paidInstead}, skipped ${s.skipped}` 
      ); 
    } 
  } catch (err) { 
    console.error("Expiry job failed:", err.message); 
  } finally { 
    running = false; 
  } 
} 
 
function startExpiryJob() { 
  if (!isRazorpayConfigured) { 
    console.log("Expiry job is off (Razorpay is not configured)."); 
    return; 
  } 
  const everyMs = EXPIRY_JOB_INTERVAL_MINUTES * 60 * 1000; 
  timer = setInterval(runOnce, everyMs); 
  timer.unref(); // does not keep the process alive on its own 
  setTimeout(runOnce, 15000).unref(); // first pass shortly after start 
 
  console.log( 
    `Expiry job is on: unpaid UPI orders are cancelled after ` + 
      `${UPI_PAYMENT_WINDOW_MINUTES} minutes ` + 
      `(checked every ${EXPIRY_JOB_INTERVAL_MINUTES} minutes).` 
  ); 
} 
 
function stopExpiryJob() { 
  if (timer) clearInterval(timer); 
  timer = null; 
} 
 
module.exports = { expireUnpaidOrders, startExpiryJob, stopExpiryJob }; 