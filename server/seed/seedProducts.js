// One-time script. Run from server/:  node seed/seedProducts.js 
// Prices are in Indian Rupees (INR), stored as plain numbers. 
require("../config/dnsFix"); 
const { connectDB, disconnectDB, describeDbError } = require("../config/db"); 
const Product = require("../models/Product"); 
 
const sampleProducts = [ 
  { 
    name: "Wireless Headphones", 
    description: "Over-ear Bluetooth headphones with 30-hour battery life.", 
    price: 2499, 
    category: "Electronics", 
    stock: 12, 
  }, 
  { 
    name: "Smart Watch", 
    description: "Fitness tracking, heart-rate monitor, and notifications.", 
    price: 4999, 
    category: "Electronics", 
    stock: 5, 
  }, 
  { 
    name: "Running Shoes", 
    description: "Lightweight breathable shoes with extra cushioning.", 
    price: 3499, 
    category: "Fashion", 
    stock: 0, 
  }, 
  { 
    name: "Denim Jacket", 
    description: "Classic medium-wash denim jacket with a relaxed fit.", 
    price: 2799, 
    category: "Fashion", 
    stock: 9, 
  }, 
  { 
    name: "Ceramic Coffee Mug", 
    description: "350 ml glazed ceramic mug. Dishwasher safe.", 
    price: 499, 
    category: "Home", 
    stock: 40, 
  }, 
  { 
    name: "Desk Lamp", 
    description: "Adjustable LED desk lamp with three brightness levels.", 
    price: 1299, 
    category: "Home", 
    stock: 15, 
  }, 
  { 
    name: "JavaScript Handbook", 
    description: "A practical guide to modern JavaScript and async code.", 
    price: 799, 
    category: "Books", 
    stock: 20, 
  }, 
  { 
    name: "Bluetooth Speaker", 
    description: "Portable waterproof speaker with deep bass.", 
    price: 1799, 
    category: "Electronics", 
    stock: 3, 
  }, 
]; 
 
async function main() { 
  await connectDB(); 
  try { 
    const existing = await Product.countDocuments(); 
    if (existing > 0) { 
      console.log(`Products already exist (${existing}). Nothing was added.`); 
      return; 
    } 
    // insertMany checks every product against the model's rules 
    const created = await Product.insertMany(sampleProducts); 
    console.log(`Added ${created.length} sample products.`); 
  } finally { 
    await disconnectDB(); 
  } 
} 
 
main() 
  .then(() => process.exit(0)) 
  .catch((err) => { 
    console.error("Seed failed:", err.message); 
    const hint = describeDbError(err); 
    if (hint) console.error(`Hint: ${hint}`); 
    process.exit(1); 
  }); 
 
 
