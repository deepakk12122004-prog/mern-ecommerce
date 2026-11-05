const Order = require("../models/Order"); 
const Payment = require("../models/Payment"); 
const { runInTransaction } = require("./withTransaction"); 
 
// Marks an online payment as paid. Callers must ALREADY have proof that 
// the payment is real: 
//   - the verify endpoint checked the browser's signature, or 
//   - the webhook / expiry job got it from Razorpay itself. 
// Safe to call many times, and safe if two callers race. 
// 
// Returns { outcome, order, payment }, where outcome is: 
//   "paid"              the order was just marked paid 
//   "already_paid"      this same payment was recorded before 
//   "needs_refund"      money arrived, but the order cannot take it 
//                       (cancelled, or already paid some other way) 
//   "different_payment" the Razorpay order was already paid by another 
//                       payment id 
//   "missing"           no such payment record 
async function settlePayment(paymentOrId, razorpayPaymentId, signature) { 
  const paymentId = paymentOrId._id || paymentOrId; 
 
  return runInTransaction(async (session) => { 
    // Read the payment again INSIDE the transaction, so two callers 
    // racing each other cannot both change it. 
    const payment = await Payment.findById(paymentId).session(session); 
    if (!payment) return { outcome: "missing" }; 
 
    if (payment.status === "paid") { 
      if (payment.razorpayPaymentId !== razorpayPaymentId) { 
        return { outcome: "different_payment", payment }; 
      } 
      return { 
        outcome: payment.needsRefund ? "needs_refund" : "already_paid", 
        payment, 
      }; 
    } 
 
    const now = new Date(); 
 
    // Only a pending, not-cancelled UPI order can become paid 
    const order = await Order.findOneAndUpdate( 
      { 
        _id: payment.order, 
        paymentMethod: "UPI", 
        paymentStatus: "pending", 
        status: { $ne: "cancelled" }, 
      }, 
      { paymentStatus: "paid", paidAt: now, transactionId: razorpayPaymentId }, 
      { new: true, session } 
    ); 
 
    payment.razorpayPaymentId = razorpayPaymentId; 
    if (signature) payment.razorpaySignature = signature; 
    payment.verifiedAt = now; 
    payment.status = "paid"; 
    // Real money arrived. If the order could not take it, flag a refund. 
    payment.needsRefund = !order; 
    await payment.save({ session }); 
 
    return { outcome: order ? "paid" : "needs_refund", order, payment }; 
  }); 
} 
 
module.exports = { settlePayment };