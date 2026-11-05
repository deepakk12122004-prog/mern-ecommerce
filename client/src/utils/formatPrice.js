
// The store sells in Indian Rupees only. 
export const CURRENCY_CODE = "INR"; 
export const CURRENCY_SYMBOL = "\u20B9"; // the rupee sign 
// "en-IN" gives Indian digit grouping: 1,299 / 10,000 / 1,00,000 
const wholeFormat = new Intl.NumberFormat("en-IN", { 
style: "currency", 
currency: CURRENCY_CODE, 
minimumFractionDigits: 0, 
maximumFractionDigits: 0, 
}); 
const paiseFormat = new Intl.NumberFormat("en-IN", { 
style: "currency", 
currency: CURRENCY_CODE, 
minimumFractionDigits: 2, 
maximumFractionDigits: 2, 
}); 
// Turns a number into text for the screen: 
//   499     -> "₹499" 
// 1299    -> "₹1,299" 
//100000  -> "₹1,00,000" 
//499.5   -> "₹499.50"   (decimals only when there are paise) 
// The number itself stays a plain number everywhere else 
// (in MongoDB and in the API). Only the screen shows it formatted. 
export function formatPrice(amount) { 
const value = Number(amount); 
if (!Number.isFinite(value)) return ""; 
const hasPaise = Math.round(value * 100) % 100 !== 0; 
return (hasPaise ? paiseFormat : wholeFormat).format(value); 
} 