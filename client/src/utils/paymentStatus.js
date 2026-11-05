// Keep these in sync with the server (constants.js). 
// The server always has the final say. 
export const PAYMENT_METHOD_LABELS = { 
COD: "Cash on Delivery", 
UPI: "UPI Payment", 
}; 
export const PAYMENT_STATUSES = [ 
"pending", 
"paid", 
"failed", 
"refunded", 
"cancelled", 
]; 
// Which payment statuses an admin may move to next 
export const NEXT_PAYMENT_STATUSES = { 
pending: ["paid", "failed"], 
paid: ["refunded"], 
failed: [], 
refunded: [], 
cancelled: [], 
}; 
export function paymentMethodLabel(method) { 
return PAYMENT_METHOD_LABELS[method] || method || "-"; 
} 
// The statuses an admin can pick for this order. Cash payments can be 
// marked paid or failed by hand. Online payments are confirmed by the 
// payment gateway, so for those only a refund can be recorded. 
export function nextPaymentOptions(order) { 
const flow = NEXT_PAYMENT_STATUSES[order.paymentStatus] || []; 
if (order.paymentMethod === "COD") return flow; 
return flow.filter((status) => status === "refunded"); 
} 
 