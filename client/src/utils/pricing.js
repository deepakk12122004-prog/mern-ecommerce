 
// Display-only price rules, in rupees. The server recalculates these 
// itself for every cart and order, because the browser can never be 
// trusted with prices. Keep these numbers in sync with 
// server/utils/pricing.js. 
export const FREE_SHIPPING_THRESHOLD = 999; 
export const SHIPPING_FEE = 49; 
 
const round = (n) => Math.round(n * 100) / 100; 
 
export function calculatePrices(itemsPrice) { 
  const shippingPrice = 
    itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE; 
  return { 
    itemsPrice: round(itemsPrice), 
    shippingPrice, 
    totalPrice: round(itemsPrice + shippingPrice), 
  }; 
} 
 
 
