// LOCAL TEST HELPER (test keys only). Run from server/: 
//   node tests/sendWebhook.js payment.captured order_XXXX pay_YYYY 
//   node tests/sendWebhook.js payment.captured order_XXXX pay_YYYY 100 
//       (the 4th value is an amount in paise, to simulate a WRONG amount) 
//   node tests/sendWebhook.js payment.failed order_XXXX pay_YYYY 
//   node tests/sendWebhook.js payment.captured order_XXXX pay_YYYY 0 badsig 
//       (sends a WRONG signature) 
// Sends a signed fake Razorpay webhook to your local server. 
require("../config/dnsFix"); 
const crypto = require("crypto"); 
const { 
  RAZORPAY_KEY_ID, 
  RAZORPAY_WEBHOOK_SECRET, 
  PORT, 
} = require("../config/env"); 
const { connectDB, disconnectDB } = require("../config/db"); 
const Payment = require("../models/Payment"); 
 
async function main() { 
  if (!RAZORPAY_KEY_ID.startsWith("rzp_test_") || !RAZORPAY_WEBHOOK_SECRET) { 
    console.error("Needs TEST keys and RAZORPAY_WEBHOOK_SECRET in server/.env."); 
    process.exit(1); 
  } 
 
  const [eventName, orderId, paymentId, amountArg, mode] = process.argv.slice(2); 
  const okEvent = ["payment.captured", "order.paid", "payment.failed"].includes( 
    eventName 
  ); 
  const okOrder = /^order_[A-Za-z0-9]{6,40}$/.test(orderId || ""); 
  const okPayment = /^pay_[A-Za-z0-9]{6,40}$/.test(paymentId || ""); 
  if (!okEvent || !okOrder || !okPayment) { 
    console.error( 
      "Usage: node tests/sendWebhook.js <payment.captured|order.paid|" + 
        "payment.failed> order_XXXX pay_YYYY [amountPaise] [badsig]" 
    ); 
    process.exit(1); 
  } 
 
  // Default amount: the real amount of that Razorpay order (from MongoDB) 
  let amount = Number(amountArg); 
  if (!amount) { 
    await connectDB(); 
    const payment = await Payment.findOne({ razorpayOrderId: orderId }); 
    await disconnectDB(); 
    amount = payment ? payment.amountPaise : 10000; 
    if (!payment) console.log("(No such payment record: using 10000 paise.)"); 
  } 
 
  const failed = eventName === "payment.failed"; 
  const body = JSON.stringify({ 
    entity: "event", 
    event: eventName, 
    created_at: Math.floor(Date.now() / 1000), 
    payload: { 
      payment: { 
        entity: { 
          id: paymentId, 
          entity: "payment", 
          order_id: orderId, 
          amount, 
          currency: "INR", 
          status: failed ? "failed" : "captured", 
          method: "upi", 
          error_code: failed ? "BAD_REQUEST_ERROR" : null, 
          error_description: failed ? "Simulated failure" : null, 
        }, 
      }, 
    }, 
  }); 
 
  const signature = 
    mode === "badsig" 
      ? "0".repeat(64) 
      : crypto 
          .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET) 
          .update(body) 
          .digest("hex"); 
 
  const res = await fetch( 
    `http://localhost:${PORT}/api/payments/razorpay/webhook`, 
    { 
      method: "POST", 
      headers: { 
        "Content-Type": "application/json", 
        "X-Razorpay-Signature": signature, 
      }, 
      body, 
    } 
  ); 
  console.log(res.status, await res.text()); 
} 
 
main().catch((err) => { 
  console.error("Failed:", err.message); 
  process.exit(1); 
}); 