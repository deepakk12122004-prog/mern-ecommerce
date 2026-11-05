import api from "./axios"; 
// A random id for ONE checkout attempt. The server refuses to make 
// two orders with the same id, so retrying or double-clicking is safe. 
export function newIdempotencyKey() { 
if (window.crypto && typeof window.crypto.randomUUID === "function") { 
return window.crypto.randomUUID(); 
} 
const random = Math.random().toString(36).slice(2); 
return `key-${Date.now()}-${random}`; 
} 
// orderData = { items: [{ productId, quantity }], 
//               shippingAddress, paymentMethod } 
// Only ids and quantities are sent. NEVER prices. 
// Returns { order, duplicate }. duplicate is true when the server 
// had already created this order for the same key. 
export async function createOrder(orderData, idempotencyKey) { 
const res = await api.post("/orders", orderData, { 
headers: { "Idempotency-Key": idempotencyKey }, 
}); 
return { order: res.data.data, duplicate: Boolean(res.data.duplicate) }; 
} 
// params: { page, limit } 
// Returns { orders, pagination } 
export async function getMyOrders(params = {}) { 
const res = await api.get("/orders", { params }); 
return { orders: res.data.data, pagination: res.data.pagination }; 
} 
export async function getOrderById(id) { 
const res = await api.get(`/orders/${encodeURIComponent(id)}`); 
return res.data.data; 
}