// One-time script. Run from server/: 
//   node seed/convertSampleProductPrices.js 
// Moves the sample products from dollar-sized prices to rupee prices. 
require("../config/dnsFix"); 
const { connectDB, disconnectDB, describeDbError } = require("../config/db"); 
const Product = require("../models/Product"); 
 
// New prices in rupees, by product name 
const INR_PRICES = { 
  "Wireless Headphones": 2499, 
  "Smart Watch": 4999, 
  "Running Shoes": 3499, 
  "Denim Jacket": 2799, 
  "Ceramic Coffee Mug": 499, 
  "Desk Lamp": 1299, 
  "JavaScript Handbook": 799, 
  "Bluetooth Speaker": 1799, 
}; 
 
// A price at or below this looks like a dollar price. Rupee prices 
// are above it, so running this script again changes nothing. 
const LOOKS_LIKE_DOLLARS = 200; 
 
async function main() { 
  await connectDB(); 
  try { 
    const products = await Product.find({ 
      price: { $lte: LOOKS_LIKE_DOLLARS }, 
    }).select("name price"); 
 
    if (products.length === 0) { 
      console.log("Nothing to convert. No product has a price of 200 or less."); 
      return; 
    } 
 
    let converted = 0; 
    const others = []; 
 
    for (const product of products) { 
      const newPrice = INR_PRICES[product.name]; 
      if (!newPrice) { 
        others.push(product); 
        continue; 
      } 
 
      await Product.updateOne( 
        { _id: product._id }, 
        { $set: { price: newPrice } }, 
        { runValidators: true } 
      ); 
      console.log(`Updated: ${product.name}: ${product.price} -> ${newPrice}`); 
      converted += 1; 
    } 
 
    console.log(`\nConverted ${converted} sample product(s) to rupee prices.`); 
 
    if (others.length > 0) { 
      console.log("\nThese products still have a price of 200 or less."); 
      console.log("If those are dollar prices, edit them in the admin dashboard:"); 
      others.forEach((p) => console.log(`  - ${p.name}: ${p.price}`)); 
    } 
  } finally { 
    await disconnectDB(); 
  } 
} 
 
main() 
  .then(() => process.exit(0)) 
  .catch((err) => { 
    console.error("Conversion failed:", err.message); 
    const hint = describeDbError(err); 
    if (hint) console.error(`Hint: ${hint}`); 
    process.exit(1); 
  });