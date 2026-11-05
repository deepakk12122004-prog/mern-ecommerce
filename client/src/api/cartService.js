import api from "./axios"; 
 
// Asks the server to check every cart line against the database. 
// We send ONLY ids and quantities, never prices. 
// Returns { items: [...], itemsPrice, shippingPrice, totalPrice, 
//           hasIssues } 
export async function quoteCart(items, signal) { 
  const payload = items.map((item) => ({ 
    productId: item.productId, 
    quantity: item.quantity, 
  })); 
  const res = await api.post("/cart/quote", { items: payload }, { signal }); 
  return res.data.data; 
} 
 
 
