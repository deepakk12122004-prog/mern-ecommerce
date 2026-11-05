// TEMPORARY manual check. Run from server/: 
// node tests/checkModels.js 
require("../config/dnsFix"); 
const mongoose = require("mongoose"); 
const { connectDB, disconnectDB, describeDbError } = require("../config/db"); 
const User = require("../models/User"); 
const Product = require("../models/Product"); 
const Cart = require("../models/Cart"); 
const Order = require("../models/Order"); 
let failed = 0; 
const newId = () => new mongoose.Types.ObjectId(); 
function check(label, passed) { 
if (!passed) failed += 1; 
console.log(`${passed ? "PASS" : "FAIL"} - ${label}`); 
} 
// Which fields failed validation? (empty list = valid) 
async function badFields(doc) { 
try { 
await doc.validate(); 
return []; 
} catch (err) { 
return Object.keys(err.errors || {}); 
} 
} 
const hasAll = (list, wanted) => wanted.every((f) => list.includes(f)); 
 
const goodProduct = { 
  name: "Test Mug", 
  description: "A test mug.", 
  price: 12.5, 
  category: "Home", 
  stock: 10, 
}; 
 
const address = { 
  fullName: "Test User", 
  address: "12 Park Street", 
  city: "Kolkata", 
  postalCode: "700016", 
  country: "India", 
  phone: "9876543210", 
}; 
 
const goodOrder = () => ({ 
  user: newId(), 
  items: [{ product: newId(), name: "Test Mug", price: 12, quantity: 2 }], 
  shippingAddress: address, 
  itemsPrice: 24, 
  shippingPrice: 7.99, 
  totalPrice: 31.99, 
}); 
 
async function checkUser() { 
  console.log("\n--- User ---"); 
  const bad = await badFields( 
    new User({ name: "A", email: "nope", password: "short", role: "hacker" }) 
  ); 
  check("bad user rejected", hasAll(bad, ["name", "email", "password", "role"])); 
 
  const good = new User({ 
    name: "Test User", 
    email: "Test@Example.COM", 
    password: "password123", 
  }); 
  check("good user passes", (await badFields(good)).length === 0); 
  check("email is lowercased", good.email === "test@example.com"); 
} 
 
async function checkProduct() { 
  console.log("\n--- Product ---"); 
  const bad = await badFields( 
    new Product({ 
      name: "", 
      description: "", 
      price: -5, 
      category: "", 
      stock: -1, 
      image: { url: "http://insecure.example/x.png" }, 
    }) 
  ); 
  const wanted = ["name", "description", "price", "category", "stock"]; 
  check("bad product rejected", hasAll(bad, [...wanted, "image.url"])); 
 
  const price3 = await badFields(new Product({ ...goodProduct, price: 19.999 })); 
  check("price with 3 decimals rejected", price3.includes("price")); 
 
  const stock = await badFields(new Product({ ...goodProduct, stock: 2.5 })); 
  check("fractional stock rejected", stock.includes("stock")); 
 
  const good = await badFields(new Product(goodProduct)); 
  check("good product passes", good.length === 0); 
} 
 
async function checkCart() { 
  console.log("\n--- Cart ---"); 
  const productId = newId(); 
  const line = (quantity) => ({ product: productId, quantity }); 
 
  const dup = await badFields( 
    new Cart({ user: newId(), items: [line(1), line(2)] }) 
  ); 
  check("same product twice rejected", dup.includes("items")); 
 
  const zero = await badFields(new Cart({ user: newId(), items: [line(0)] })); 
  check("quantity 0 rejected", zero.includes("items.0.quantity")); 
 
  const big = await badFields(new Cart({ user: newId(), items: [line(100)] })); 
  check("quantity 100 rejected", big.includes("items.0.quantity")); 
 
  const good = await badFields(new Cart({ user: newId(), items: [line(2)] })); 
  check("good cart passes", good.length === 0); 
 
  const empty = await badFields(new Cart({ user: newId() })); 
  check("empty cart is allowed", empty.length === 0); 
} 
 
async function checkOrder() { 
  console.log("\n--- Order ---"); 
  const empty = await badFields( 
    new Order({ 
      user: newId(), 
      items: [], 
      itemsPrice: 0, 
      shippingPrice: 0, 
      totalPrice: 0, 
    }) 
  ); 
  check("empty order rejected", hasAll(empty, ["items", "shippingAddress"])); 
 
  const goodDoc = new Order(goodOrder()); 
  check("good order passes", (await badFields(goodDoc)).length === 0); 
  check("default status is pending", goodDoc.status === "pending"); 
  check("default payment is COD", goodDoc.paymentMethod === "COD"); 
 
  const wrongTotal = await badFields( 
    new Order({ ...goodOrder(), totalPrice: 20 }) 
  ); 
  check("wrong total rejected", wrongTotal.includes("totalPrice")); 
 
  const wrongItems = await badFields( 
    new Order({ ...goodOrder(), itemsPrice: 1 }) 
  ); 
  check("wrong items price rejected", wrongItems.includes("itemsPrice")); 
 
  const badStatus = await badFields( 
    new Order({ ...goodOrder(), status: "teleported" }) 
  ); 
  check("unknown status rejected", badStatus.includes("status")); 
 
  const badPhone = await badFields( 
    new Order({ 
      ...goodOrder(), 
      shippingAddress: { ...address, phone: "abc" }, 
    }) 
  ); 
  check("bad phone rejected", badPhone.includes("shippingAddress.phone")); 
 
  check("pending -> processing allowed", goodDoc.canChangeStatusTo("processing")); 
  check("pending -> delivered blocked", !goodDoc.canChangeStatusTo("delivered")); 
  goodDoc.status = "delivered"; 
  check("delivered -> pending blocked", !goodDoc.canChangeStatusTo("pending")); 
} 
 
async function checkDatabase() { 
  console.log("\n--- Database (real save) ---"); 
  const email = `modelcheck-${Date.now()}@example.test`; 
  const data = { name: "Model Check", email, password: "password123" }; 
  let created = null; 
 
  try { 
    created = await User.create(data); 
 
    const withHash = await User.findById(created._id).select("+password"); 
    const hash = withHash.password; 
    check("password stored as a hash", hash !== "password123"); 
    check("hash looks like bcrypt", hash.startsWith("$2")); 
    check("right password accepted", await withHash.comparePassword("password123")); 
    check("wrong password rejected", !(await withHash.comparePassword("nope"))); 
 
    const plain = await User.findById(created._id); 
    check("password hidden by default", plain.password === undefined); 
    check("password absent from JSON", !("password" in plain.toJSON())); 
    check("default role is user", plain.role === "user"); 
 
    let duplicateCode = null; 
    try { 
      await User.create(data); 
    } catch (err) { 
      duplicateCode = err.code; 
    } 
    check("duplicate email rejected (code 11000)", duplicateCode === 11000); 
  } finally { 
    if (created) await User.deleteOne({ _id: created._id }); 
  } 
} 
 
async function showIndexes() { 
  console.log("\n--- Indexes in MongoDB ---"); 
  const models = [User, Product, Cart, Order]; 
  for (const Model of models) { 
    const indexes = await Model.collection.indexes(); 
    const names = indexes.map((i) => i.name).join(", "); 
    console.log(`${Model.collection.name}: ${names}`); 
  } 
} 
 
async function main() { 
  await connectDB(); 
  try { 
    // Builds every index (this also creates the empty collections) 
    await Promise.all([User.init(), Product.init(), Cart.init(), Order.init()]); 
    await checkUser(); 
    await checkProduct(); 
    await checkCart(); 
    await checkOrder(); 
    await checkDatabase(); 
await showIndexes(); 
} finally { 
await disconnectDB(); 
} 
console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} FAILED.`); 
process.exit(failed === 0 ? 0 : 1); 
} 
main().catch((err) => { 
console.error("Check script crashed:", err.message); 
const hint = describeDbError(err); 
if (hint) console.error(`Hint: ${hint}`); 
process.exit(1); 
});