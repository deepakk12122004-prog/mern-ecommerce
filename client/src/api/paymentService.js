 
import api from "./axios"; 
 
// Which payment methods can be used right now. 
// Returns { methods: ["COD", "UPI"], currency: "INR" } 
export async function getPaymentMethods() { 
  const res = await api.get("/payments/methods"); 
  return res.data.data; 
} 
 
// Asks the server to start a payment for one of OUR orders. 
// We send only the order id. The server decides the amount. 
// Returns what the payment window needs (public key id, amount in 
// paise, Razorpay order id...). The secret key is never included. 
export async function createRazorpayOrder(orderId) { 
  const res = await api.post("/payments/razorpay/order", { orderId }); 
  return res.data.data; 
} 
 
// Sends the proof of payment to OUR server, which checks the 
// signature with the secret key. Returns the updated order. 
// payload: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } 
export async function verifyRazorpayPayment(payload) { 
  const res = await api.post("/payments/razorpay/verify", payload); 
  return res.data.data; 
} 
 
// Tells the server that an attempt failed or was cancelled. 
// (This only records it. It never changes the order's payment status.) 
// payload: { orderId, razorpayOrderId, reason: "failed"|"cancelled", error } 
export async function reportPaymentFailure(payload) { 
  await api.post("/payments/razorpay/failure", payload); 
} 