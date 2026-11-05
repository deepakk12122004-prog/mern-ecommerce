import api from "./axios"; 
 
// Removes empty values, so we never send "?search=&status=". 
function cleanParams(params) { 
  const clean = {}; 
  Object.entries(params).forEach(([key, value]) => { 
    if (value !== undefined && value !== null && value !== "") { 
      clean[key] = value; 
    } 
  }); 
  return clean; 
} 
 
// Every function here needs an admin login. The server refuses 
// everyone else (401 or 403), whatever the screen shows. 
 
export async function getAdminStats() { 
  const res = await api.get("/admin/stats"); 
  return res.data.data; 
} 
 
// params: { search, category, status, stock, sort, page, limit } 
export async function getAdminProducts(params = {}) { 
  const res = await api.get("/admin/products", { 
    params: cleanParams(params), 
  }); 
  return { 
    products: res.data.data, 
    pagination: res.data.pagination, 
    lowStockThreshold: res.data.lowStockThreshold, 
  }; 
} 
 
// data: { name, description, price, category, stock, isActive } 
export async function createProduct(data) { 
  const res = await api.post("/products", data); 
  return res.data.data; 
} 
 
// Send only the fields you want to change 
export async function updateProduct(id, data) { 
  const res = await api.put(`/products/${encodeURIComponent(id)}`, data); 
  return res.data.data; 
} 
 
export async function deleteProduct(id) { 
  await api.delete(`/products/${encodeURIComponent(id)}`); 
} 
 
// params: { status, paymentMethod, paymentStatus, page, limit } 
export async function getAdminOrders(params = {}) { 
  const res = await api.get("/admin/orders", { params: cleanParams(params) }); 
  return { orders: res.data.data, pagination: res.data.pagination }; 
} 
 
export async function getAdminOrder(id) { 
  const res = await api.get(`/admin/orders/${encodeURIComponent(id)}`); 
  return res.data.data; 
} 
 
export async function updateOrderStatus(id, status) { 
  const res = await api.put( 
    `/admin/orders/${encodeURIComponent(id)}/status`, 
    { status } 
  ); 
  return res.data.data; 
} 
 
// paymentStatus: "paid", "failed" or "refunded" 
export async function updatePaymentStatus(id, paymentStatus) { 
  const res = await api.put( 
    `/admin/orders/${encodeURIComponent(id)}/payment-status`, 
    { paymentStatus } 
  ); 
  return res.data.data; 
} 
 
// params: { status, refund, page, limit } 
// status: "created", "paid", "failed" or "cancelled"; refund: "needed" 
export async function getAdminPayments(params = {}) { 
  const res = await api.get("/admin/payments", { 
    params: cleanParams(params), 
  }); 
  return { payments: res.data.data, pagination: res.data.pagination }; 
} 
 
// Clears the "refund needed" flag after the refund was made 
// in the Razorpay Dashboard 
export async function markRefundDone(id) { 
  const res = await api.put( 
    `/admin/payments/${encodeURIComponent(id)}/refund-done` 
  ); 
  return res.data.data; 
} 