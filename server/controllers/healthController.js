const mongoose = require("mongoose"); 
const { NODE_ENV } = require("../config/env"); 
 
// Mongoose's numeric connection states, as words 
const DB_STATES = { 
  0: "disconnected", 
  1: "connected", 
  2: "connecting", 
  3: "disconnecting", 
}; 
 
// GET /api/health 
// 200 when everything works, 503 when the database is down. 
function getHealth(req, res) { 
  const database = DB_STATES[mongoose.connection.readyState] || "unknown"; 
  const healthy = database === "connected"; 
 
  const data = { 
    status: healthy ? "ok" : "degraded", 
    environment: NODE_ENV, 
    database, 
    uptimeSeconds: Math.round(process.uptime()), 
    timestamp: new Date().toISOString(), 
  }; 
 
  if (healthy) { 
    return res.status(200).json({ success: true, data }); 
  } 
  return res.status(503).json({ 
    success: false, 
    message: "Database is not connected.", 
    data, 
  }); 
} 
// GET /api/health/error  (development only, see healthRoutes.js) 
// Deliberately crashes so you can see the error handler working. 
function triggerTestError() { 
throw new Error("Test error: this crash is deliberate."); 
} 
module.exports = { getHealth, triggerTestError };