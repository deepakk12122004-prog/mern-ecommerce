// LOCAL TEST HELPER (test keys only). Run from server/: 
//   node tests/signPayment.js order_XXXXXXXXXX pay_TESTPAYMENT01 
// Prints the signature Razorpay would send for this pair. 
// It uses YOUR test key secret from .env, and never prints the secret. 
const crypto = require("crypto"); 
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require("../config/env"); 
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) { 
console.error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env."); 
process.exit(1); 
} 
if (!RAZORPAY_KEY_ID.startsWith("rzp_test_")) { 
console.error("Refusing to run: this helper only works with TEST keys."); 
process.exit(1); 
} 
const [orderId, paymentId] = process.argv.slice(2); 
const okOrder = /^order_[A-Za-z0-9]{6,40}$/.test(orderId || ""); 
const okPayment = /^pay_[A-Za-z0-9]{6,40}$/.test(paymentId || ""); 
if (!okOrder || !okPayment) { 
console.error("Usage: node tests/signPayment.js order_XXXXXXXXXX pay_YYYYYYYYYY"); 
 process.exit(1); 
} 
const signature = crypto 
.createHmac("sha256", RAZORPAY_KEY_SECRET) 
.update(`${orderId}|${paymentId}`) 
.digest("hex"); 
console.log(signature);