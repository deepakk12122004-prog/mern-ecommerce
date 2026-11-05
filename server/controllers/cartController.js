const Product = require("../models/Product"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { calculatePrices } = require("../utils/pricing"); 
const { MAX_ITEM_QUANTITY } = require("../config/constants"); 
 
// POST /api/cart/quote 
// Body: { items: [{ productId, quantity }] } 
// 
// The browser's idea of a price is never used. Every name, price, 
// stock number and total in the answer comes from MongoDB. 
// 
// Each line gets a status: 
//   ok           - available in the quantity asked for 
//   reduced      - fewer in stock than asked; we count only what exists 
//   out_of_stock - stock is 0; not counted 
//   unavailable  - deleted or hidden; not counted 
const quoteCart = asyncHandler(async (req, res) => { 
  // Copy ONLY productId and quantity. Anything else the browser 
  // sent (like a "price") is ignored. The same product listed twice 
  // is merged into one line. 
  const wanted = new Map(); 
  req.body.items.forEach((item) => { 
    const productId = String(item.productId); 
    const quantity = Number(item.quantity); 
    const total = (wanted.get(productId) || 0) + quantity; 
    wanted.set(productId, Math.min(total, MAX_ITEM_QUANTITY)); 
  }); 
 
  const products = await Product.find({ _id: { $in: [...wanted.keys()] } }) 
    .select("name price stock isActive image") 
    .lean(); 
  const byId = new Map(products.map((p) => [String(p._id), p])); 
 
  const lines = []; 
  let cents = 0; // whole cents, so decimals never drift 
 
  wanted.forEach((requestedQuantity, productId) => { 
    const product = byId.get(productId); 
 
    // Deleted or hidden. We reveal nothing about the product itself. 
    if (!product || !product.isActive) { 
      lines.push({ 
        productId, 
        status: "unavailable", 
        requestedQuantity, 
        quantity: 0, 
        name: null, 
        price: null, 
        image: null, 
        stock: 0, 
        lineTotal: 0, 
      }); 
      return; 
    } 
 
    const quantity = Math.min(requestedQuantity, product.stock); 
    let status = "ok"; 
    if (product.stock < 1) status = "out_of_stock"; 
    else if (quantity < requestedQuantity) status = "reduced"; 
 
    const lineCents = Math.round(product.price * 100) * quantity; 
    cents += lineCents; 
 
    lines.push({ 
      productId, 
      status, 
      requestedQuantity, 
      quantity, // how many are counted in the totals 
      name: product.name, 
      price: product.price, 
      image: (product.image && product.image.url) || "", 
      stock: product.stock, 
      lineTotal: lineCents / 100, 
    }); 
  }); 
 
  const prices = calculatePrices(cents / 100); 
 
  res.status(200).json({ 
    success: true, 
    data: { 
      items: lines, 
      ...prices, 
      hasIssues: lines.some((line) => line.status !== "ok"), 
    }, 
  }); 
}); 
 
module.exports = { quoteCart }; 