// Small reusable checks used by the Mongoose models. 
// 5 is a whole number, 5.5 is not. 
function isWholeNumber(value) { 
return Number.isInteger(value); 
} 
// 19.99 is fine, 19.999 is not. 
function hasAtMostTwoDecimals(value) { 
const cents = value * 100; 
return Math.abs(cents - Math.round(cents)) < 1e-6; 
} 
// Rounds money to 2 decimals (0.1 + 0.2 becomes 0.3). 
function roundMoney(value) { 
return Math.round((value + Number.EPSILON) * 100) / 100; 
} 
// Accepts "" (no image yet) or a link starting with https:// 
function isHttpsUrlOrEmpty(value) { 
return value === "" || /^https:\/\/\S+$/i.test(value); 
} 
// True when no product appears twice in the list. 
function hasUniqueProducts(items) { 
const ids = items.map((item) => String(item.product)); 
return new Set(ids).size === ids.length; 
} 
module.exports = { 
isWholeNumber, 
hasAtMostTwoDecimals, 
roundMoney, 
isHttpsUrlOrEmpty, 
hasUniqueProducts, 
};