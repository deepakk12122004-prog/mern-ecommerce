const { roundMoney } = require("./validators"); 
 
// All money in this app is in Indian Rupees (INR), stored as plain 
// numbers (for example 499 or 499.5). Keep these in sync with 
// client/src/utils/pricing.js (the frontend copy is only for display). 
const FREE_SHIPPING_THRESHOLD = 999; 
const SHIPPING_FEE = 49; 
 
// itemsPrice -> { itemsPrice, shippingPrice, totalPrice } 
function calculatePrices(itemsPrice) { 
  const items = roundMoney(itemsPrice); 
  const free = items === 0 || items >= FREE_SHIPPING_THRESHOLD; 
  const shippingPrice = free ? 0 : SHIPPING_FEE; 
 
  return { 
    itemsPrice: items, 
    shippingPrice, 
    totalPrice: roundMoney(items + shippingPrice), 
  }; 
} 
 
module.exports = { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, calculatePrices }; 
 
