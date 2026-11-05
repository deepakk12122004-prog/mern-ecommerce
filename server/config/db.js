const mongoose = require("mongoose"); 
const { MONGO_URI } = require("./env"); 
 
let closing = false; // true while we shut down on purpose 
 
// Turns a raw error into advice a beginner can act on. 
// It never prints the connection string, because it holds the password. 
function describeDbError(err) { 
  const text = `${err.name} ${err.message}`; 
 
  if (/MONGO_URI is missing/i.test(text)) { 
    return "Add MONGO_URI to server/.env (see .env.example)."; 
  } 
  if (/Invalid scheme|Invalid connection string|Invalid URL/i.test(text)) { 
    return ( 
      "MONGO_URI must start with mongodb:// or mongodb+srv:// . " + 
      "Check server/.env for typos or leftover placeholder text." 
    ); 
  } 
  if (/unescaped|malformed/i.test(text)) { 
    return ( 
      "Your password probably has special characters. " + 
      "Use a letters-and-numbers password, or URL-encode it." 
    ); 
  } 
  if (/bad auth|Authentication failed/i.test(text)) { 
    return "Wrong username or password in MONGO_URI."; 
  } 
  if (/ENOTFOUND|querySrv|ECONNREFUSED|ServerSelection|timed out/i.test(text)) { 
    return ( 
      "Cannot reach the database. Check your internet, that MongoDB " + 
      "is running (local), or that your IP is allowed in Atlas " + 
      "Network Access." 
    ); 
  } 
  return ""; 
} 
 
// Connects once. Throws if it cannot connect. 
async function connectDB() { 
  if (!MONGO_URI) { 
    throw new Error("MONGO_URI is missing."); 
  } 
 
  const { connection } = mongoose; 
 
  // Events that can happen AFTER the first successful connection 
  connection.on("error", (err) => { 
    console.error("MongoDB error:", err.message); 
  }); 
  connection.on("disconnected", () => { 
    if (!closing) console.warn("MongoDB disconnected. Trying to reconnect..."); 
  }); 
  connection.on("reconnected", () => { 
    console.log("MongoDB reconnected."); 
  }); 
 
  // Give up after 10 seconds instead of the default 30 
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 }); 
 
  // Only host and database name are printed, never the password 
  console.log(`MongoDB connected: ${connection.host}/${connection.name}`); 
} 
 
// Closes the connection cleanly (used during shutdown) 
async function disconnectDB() { 
  closing = true; 
  await mongoose.disconnect(); 
} 
 
module.exports = { connectDB, disconnectDB, describeDbError };