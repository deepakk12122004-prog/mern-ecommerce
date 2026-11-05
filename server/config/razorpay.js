const Razorpay = require("razorpay"); 
const { 
  RAZORPAY_KEY_ID, 
  RAZORPAY_KEY_SECRET, 
  isRazorpayConfigured, 
} = require("./env"); 
 
// The official Razorpay SDK, connected to your account. 
// It only exists when both keys are set in server/.env. 
const razorpay = isRazorpayConfigured 
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET }) 
  : null; 
 
// Tell the developer which mode we are in (never print the secret) 
if (isRazorpayConfigured) { 
  const mode = RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "LIVE" : "TEST"; 
  console.log(`Razorpay is configured (${mode} mode).`); 
} else { 
  console.log("Razorpay is not configured. UPI payments are disabled."); 
} 
 
module.exports = { razorpay, isRazorpayConfigured };