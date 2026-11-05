 
// Keep these in sync with the server (constants.js). 
// The server always has the final say. 
export const ORDER_STATUSES = [ 
  "pending", 
  "processing", 
  "shipped", 
  "delivered", 
  "cancelled", 
]; 
 
// Which statuses an order may move to next 
export const NEXT_STATUSES = { 
  pending: ["processing", "cancelled"], 
  processing: ["shipped", "cancelled"], 
  shipped: ["delivered"], 
  delivered: [], 
  cancelled: [], 
}; 
 
export function capitalize(text) { 
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""; 
}