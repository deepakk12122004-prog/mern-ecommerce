// One-time script. Run from server/:  node seed/migrateOrderPayments.js 
// Gives old orders a paymentStatus (they were all Cash on Delivery). 
//   cancelled orders -> payment "cancelled" 
//   delivered orders -> payment "paid" (cash is collected on delivery) 
//   all other orders -> payment "pending" 
require("../config/dnsFix"); 
const { connectDB, disconnectDB, describeDbError } = require("../config/db"); 
const Order = require("../models/Order"); 
 
async function main() { 
  await connectDB(); 
  try { 
    // Only orders that have no paymentStatus yet. (We keep updatedAt 
    // as it is, so "timestamps: false".) 
    const missing = { paymentStatus: { $exists: false } }; 
    const keepDates = { timestamps: false }; 
 
    const noMethod = await Order.updateMany( 
      { paymentMethod: { $exists: false } }, 
      { $set: { paymentMethod: "COD" } }, 
      keepDates 
    ); 
 
    const cancelled = await Order.updateMany( 
      { ...missing, status: "cancelled" }, 
      { $set: { paymentStatus: "cancelled" } }, 
      keepDates 
    ); 
 
    // Delivered orders: paid, with the paid date = last update date 
    const delivered = await Order.find({ ...missing, status: "delivered" }) 
      .select("updatedAt") 
      .lean(); 
    for (const order of delivered) { 
      await Order.updateOne( 
        { _id: order._id }, 
        { $set: { paymentStatus: "paid", paidAt: order.updatedAt } }, 
        keepDates 
      ); 
    } 
 
    const rest = await Order.updateMany( 
      missing, 
      { $set: { paymentStatus: "pending" } }, 
      keepDates 
    ); 
 
    console.log(`Payment method set on ${noMethod.modifiedCount} order(s).`); 
    console.log(`Marked cancelled: ${cancelled.modifiedCount}`); 
    console.log(`Marked paid (delivered): ${delivered.length}`); 
    console.log(`Marked pending: ${rest.modifiedCount}`); 
  } finally { 
    await disconnectDB(); 
  } 
} 
 
main() 
  .then(() => process.exit(0)) 
  .catch((err) => { 
    console.error("Migration failed:", err.message); 
    const hint = describeDbError(err); 
    if (hint) console.error(`Hint: ${hint}`); 
    process.exit(1); 
  }); 
 
 
