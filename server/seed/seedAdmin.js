// One-time script. Run from server/:  node seed/seedAdmin.js 
require("../config/dnsFix"); 
const { connectDB, disconnectDB, describeDbError } = require("../config/db"); 
const User = require("../models/User"); 
 
async function main() { 
  // config/db has loaded .env by now 
  const name = (process.env.ADMIN_NAME || "Admin").trim(); 
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase(); 
  const password = process.env.ADMIN_PASSWORD || ""; 
 
  if (!email || !password) { 
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first."); 
    process.exit(1); 
  } 
 
  await connectDB(); 
  try { 
    const existing = await User.findOne({ email }); 
 
    if (existing && existing.role === "admin") { 
      console.log(`${email} is already an admin.`); 
    } else if (existing) { 
      existing.role = "admin"; 
      await existing.save(); 
      console.log(`${email} was promoted to admin.`); 
    } else { 
      await User.create({ name, email, password, role: "admin" }); 
      console.log(`Admin created: ${email}`); 
    } 
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