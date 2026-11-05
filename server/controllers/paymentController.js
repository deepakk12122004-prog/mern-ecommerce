const crypto = require("crypto"); 
const Order = require("../models/Order"); 
const Payment = require("../models/Payment"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { settlePayment } = require("../utils/settlePayment"); 
const { razorpay, isRazorpayConfigured } = require("../config/razorpay"); 
const { 
RAZORPAY_KEY_ID, 
RAZORPAY_KEY_SECRET, 
RAZORPAY_WEBHOOK_SECRET, 
isWebhookConfigured, 
UPI_PAYMENT_WINDOW_MINUTES, 
} = require("../config/env"); 
const { ENABLED_PAYMENT_METHODS } = require("../config/constants"); 
const MIN_AMOUNT_PAISE = 100; // Razorpay's minimum is 1 rupee 
const CANNOT_APPLY_MESSAGE = 
"We received your payment, but this order can no longer accept it " + 
"(it was cancelled or is already paid). Please contact support with " + 
"your order number so it can be refunded."; 
function requireRazorpay() { 
if (!isRazorpayConfigured) { 
throw new AppError("Online payments are not set up on this server.", 503); 
} 
} 
// Rupees to paise, as a whole number (499.5 -> 49950) 
function toPaise(rupees) { 
return Math.round(rupees * 100); 
} 
// Keeps only text, cut to a safe length 
function clip(value, max) { 
  return typeof value === "string" ? value.slice(0, max) : undefined; 
} 
 
// Compares two hex texts without leaking timing information 
function safeEqualHex(given, expected) { 
  const a = Buffer.from(String(given || "").toLowerCase(), "utf8"); 
  const b = Buffer.from(String(expected), "utf8"); 
  return a.length === b.length && crypto.timingSafeEqual(a, b); 
} 
 
// Razorpay's documented check for a payment made in the browser: 
// the signature must equal HMAC-SHA256("order_id|payment_id") made with 
// OUR key secret. Only Razorpay and we know the secret, so a matching 
// signature proves the payment is real. 
function isValidPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) { 
  const expected = crypto 
    .createHmac("sha256", RAZORPAY_KEY_SECRET) 
    .update(`${razorpayOrderId}|${razorpayPaymentId}`) 
    .digest("hex"); 
  return safeEqualHex(signature, expected); 
} 
 
// Razorpay's check for a webhook: HMAC-SHA256 of the EXACT raw body, 
// made with the webhook secret (a different secret). 
function isValidWebhookSignature(rawBody, signature) { 
  const expected = crypto 
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET) 
    .update(rawBody) 
    .digest("hex"); 
  return safeEqualHex(signature, expected); 
} 
 
// GET /api/payments/methods   (public) 
// Which payment methods customers can use right now, and how long an 
// unpaid UPI order is kept. 
const getPaymentMethods = (req, res) => { 
  res.status(200).json({ 
    success: true, 
    data: { 
      methods: ENABLED_PAYMENT_METHODS, 
      currency: "INR", 
      upiPaymentWindowMinutes: UPI_PAYMENT_WINDOW_MINUTES, 
    }, 
  }); 
}; 
 
// POST /api/payments/razorpay/order   (logged in)   Body: { orderId } 
// Starts a payment for a UPI order that has already been placed. 
const createRazorpayOrder = asyncHandler(async (req, res) => { 
  requireRazorpay(); 
 
  // Only the user's OWN order can be paid. Someone else's order 
  // looks exactly like a missing one. 
  const order = await Order.findOne({ 
    _id: req.body.orderId, 
    user: req.user._id, 
  }); 
  if (!order) throw new AppError("Order not found.", 404); 
 
  if (order.paymentMethod !== "UPI") { 
    throw new AppError("This order is not a UPI order.", 409); 
  } 
  if (order.status === "cancelled") { 
    throw new AppError("This order was cancelled.", 409); 
  } 
  if (order.paymentStatus !== "pending") { 
    throw new AppError( 
      `The payment for this order is already ${order.paymentStatus}.`, 
      409 
    ); 
  } 
 
  // The amount comes from the ORDER in MongoDB (which the server 
  // calculated from product prices). The browser sends no amount. 
  const amountPaise = toPaise(order.totalPrice); 
  if (amountPaise < MIN_AMOUNT_PAISE) { 
    throw new AppError( 
      "This order total is below the minimum for online payment (1 rupee).", 
      409 
    ); 
  } 
 
  // Retrying? Reuse the open Razorpay order for the same amount, 
  // so retries do not pile up. 
  let payment = await Payment.findOne({ 
    order: order._id, 
    amountPaise, 
    status: { $ne: "paid" }, 
  }).sort({ createdAt: -1 }); 
 
  if (!payment) { 
    let razorpayOrder; 
    try { 
      razorpayOrder = await razorpay.orders.create({ 
        amount: amountPaise, 
        currency: "INR", 
        receipt: `rcpt_${order._id}`, 
        notes: { 
          orderId: String(order._id), 
          userId: String(req.user._id), 
        }, 
      }); 
    } catch (err) { 
      // The details stay in the server log, not in the response 
      console.error("Razorpay order creation failed:", err.error || err); 
      throw new AppError("Could not start the payment. Please try again.", 502); 
    } 
 
    payment = await Payment.create({ 
      order: order._id, 
      user: req.user._id, 
      amountPaise, 
      razorpayOrderId: razorpayOrder.id, 
    }); 
  } 
 
  // Everything the payment window needs. The secret key is NOT here. 
  res.status(200).json({ 
    success: true, 
    data: { 
      keyId: RAZORPAY_KEY_ID, 
      razorpayOrderId: payment.razorpayOrderId, 
      amount: payment.amountPaise, 
      currency: "INR", 
      orderId: String(order._id), 
      description: `Order #${String(order._id).slice(-6).toUpperCase()}`, 
      prefill: { 
        name: req.user.name, 
        email: req.user.email, 
        contact: String(order.shippingAddress.phone).replace(/[^\d+]/g, ""), 
      }, 
    }, 
  }); 
}); 
 
// POST /api/payments/razorpay/verify   (logged in) 
// Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } 
// The browser's way to confirm a payment. The signature is checked here. 
const verifyRazorpayPayment = asyncHandler(async (req, res) => { 
  requireRazorpay(); 
 
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = 
    req.body; 
 
  // The payment record must belong to this user and this order 
  const payment = await Payment.findOne({ 
    razorpayOrderId, 
    order: orderId, 
    user: req.user._id, 
  }); 
  if (!payment) throw new AppError("Payment not found.", 404); 
 
  // THE SECURITY CHECK. Without a valid signature nothing is marked paid, 
  // whatever the browser claims. 
  if ( 
    !isValidPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) 
  ) { 
    console.warn( 
      `Invalid Razorpay signature: order ${orderId}, user ${req.user._id}` 
    ); 
    throw new AppError( 
      "Payment verification failed. Your order was not marked as paid. " + 
        "If money was deducted, contact support with your order number.", 
      400 
    ); 
  } 
 
  let result; 
  try { 
    result = await settlePayment(payment, razorpayPaymentId, razorpaySignature); 
  } catch (err) { 
    // The same Razorpay payment id can never be used twice 
    if (err && err.code === 11000) { 
      throw new AppError( 
        "This payment has already been used for another order.", 
        409 
      ); 
    } 
    throw err; 
  } 
 
  if (result.outcome === "different_payment") { 
    throw new AppError( 
      "This order was already paid with a different payment.", 
      409 
    ); 
  } 
  if (result.outcome === "needs_refund") { 
    console.warn(`Payment ${razorpayPaymentId} needs a refund (order ${orderId})`); 
    throw new AppError(CANNOT_APPLY_MESSAGE, 409); 
  } 
  if (result.outcome === "already_paid") { 
    const paidOrder = await Order.findById(payment.order); 
    return res 
      .status(200) 
      .json({ success: true, alreadyVerified: true, data: paidOrder }); 
  } 
 
  res.status(200).json({ success: true, data: result.order }); 
}); 
 
// POST /api/payments/razorpay/failure   (logged in) 
// Body: { orderId, razorpayOrderId, reason: "failed"|"cancelled", error? } 
// Records what the payment window reported. The browser can be wrong or 
// lying, so this NEVER changes the order's payment status: the order 
// stays "pending" and the customer can try again. 
const recordPaymentFailure = asyncHandler(async (req, res) => { 
  const { orderId, razorpayOrderId, reason } = req.body; 
  const details = req.body.error || {}; 
 
  const payment = await Payment.findOne({ 
    razorpayOrderId, 
    order: orderId, 
    user: req.user._id, 
  }); 
  if (!payment) throw new AppError("Payment not found.", 404); 
 
  // A verified payment is never overwritten by what the browser says 
  if (payment.status === "paid") { 
    return res.status(200).json({ success: true, data: { status: "paid" } }); 
  } 
 
  payment.status = reason; 
  payment.events.push({ 
    kind: reason, 
    code: clip(details.code, 60), 
    description: clip(details.description, 200), 
    reason: clip(details.reason, 60), 
    step: clip(details.step, 60), 
    at: new Date(), 
  }); 
  if (payment.events.length > 10) { 
    payment.events = payment.events.slice(-10); // keep the latest 10 
  } 
  await payment.save(); 
 
  res.status(200).json({ success: true, data: { status: payment.status } }); 
}); 
 
// POST /api/payments/razorpay/webhook   (called by Razorpay, no login) 
// Razorpay tells us about payments itself, so an order is marked paid 
// even if the customer's browser closed right after paying. 
// Security: the request is only accepted if its signature matches 
// (HMAC of the raw body with the webhook secret). 
// Events can arrive more than once. Everything here is safe to repeat. 
const razorpayWebhook = asyncHandler(async (req, res) => { 
  if (!isWebhookConfigured) { 
    throw new AppError("Webhooks are not set up on this server.", 503); 
  } 
 
  // app.js keeps the raw body for this route 
  const raw = req.body; 
  if (!Buffer.isBuffer(raw)) { 
    throw new AppError("The webhook body must be JSON.", 400); 
  } 
 
  if (!isValidWebhookSignature(raw, req.get("x-razorpay-signature"))) { 
    console.warn("Rejected a webhook with an invalid signature."); 
    throw new AppError("Invalid webhook signature.", 400); 
  } 
 
  let event; 
  try { 
    event = JSON.parse(raw.toString("utf8")); 
  } catch (err) { 
    throw new AppError("The webhook body is not valid JSON.", 400); 
  } 
 
  const name = event && event.event; 
  const entity = 
    event && event.payload && event.payload.payment 
      ? event.payload.payment.entity 
      : null; 
 
  // From here on we answer 200 for anything we do not need, so Razorpay 
  // does not keep retrying it. 
  const ignore = (why) => { 
    console.log(`Webhook ${name || "?"} ignored: ${why}`); 
    return res.status(200).json({ success: true, ignored: why }); 
  }; 
 
  if (!entity || !entity.id || !entity.order_id) return ignore("no payment"); 
 
  const payment = await Payment.findOne({ razorpayOrderId: entity.order_id }); 
  if (!payment) return ignore("not one of our payments"); 
 
  // A payment went through 
  if (name === "payment.captured" || name === "order.paid") { 
    const sameMoney = 
      entity.status === "captured" && 
      entity.amount === payment.amountPaise && 
      entity.currency === "INR"; 
    if (!sameMoney) { 
      console.error( 
        `Webhook amount/status mismatch for ${entity.id}: ` + 
          `got ${entity.amount} ${entity.currency} (${entity.status}), ` + 
          `expected ${payment.amountPaise} INR` 
      ); 
      return ignore("amount or status does not match"); 
    } 
 
    try { 
      const result = await settlePayment(payment, entity.id); 
      console.log(`Webhook ${name}: ${entity.id} -> ${result.outcome}`); 
      if (result.outcome === "needs_refund") { 
        console.warn(`Payment ${entity.id} needs a refund (webhook).`); 
      } 
    } catch (err) { 
      if (err && err.code === 11000) return ignore("payment id already used"); 
      throw err; // a real problem: let Razorpay retry later 
    } 
    return res.status(200).json({ success: true }); 
  } 
 
  // A payment attempt failed 
  if (name === "payment.failed") { 
    if (payment.status !== "paid") { 
      payment.status = "failed"; 
      payment.events.push({ 
        kind: "failed", 
        code: clip(entity.error_code, 60), 
        description: clip(entity.error_description, 200), 
        reason: clip(entity.error_reason, 60), 
        step: clip(entity.error_step, 60), 
        at: new Date(), 
      }); 
      if (payment.events.length > 10) { 
        payment.events = payment.events.slice(-10); 
      } 
      await payment.save(); 
    } 
    return res.status(200).json({ success: true }); 
  } 
 
  return ignore("event type not used"); 
}); 
 
module.exports = { 
  getPaymentMethods, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  recordPaymentFailure, 
  razorpayWebhook, 
}; 
 
