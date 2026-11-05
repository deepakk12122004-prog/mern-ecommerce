require("./config/dnsFix"); 
 
// Load environment variables FIRST (this require runs dotenv) 
const config = require("./config/env"); 
const app = require("./app"); 
const { connectDB, disconnectDB, describeDbError } = require("./config/db"); 
const { startExpiryJob, stopExpiryJob } = require("./jobs/expireUnpaidOrders"); 
 
let server = null; 
let shuttingDown = false; 
 
// Stops accepting requests, closes the database, then exits. 
async function shutdown(reason, exitCode = 0) { 
  if (shuttingDown) return; 
  shuttingDown = true; 
  console.log(`\n${reason}. Shutting down...`); 
 
  // Safety net: force exit if something hangs 
  const timer = setTimeout(() => { 
    console.error("Shutdown took too long. Forcing exit."); 
    process.exit(1); 
  }, 10000); 
  timer.unref(); 
 
  try { 
    stopExpiryJob(); 
    if (server) { 
      await new Promise((resolve) => server.close(() => resolve())); 
    } 
    await disconnectDB(); 
    console.log("Shutdown complete."); 
    process.exit(exitCode); 
  } catch (err) { 
    console.error("Error during shutdown:", err.message); 
    process.exit(1); 
  } 
} 
 
async function start() { 
  // 1. Connect to MongoDB first 
  try { 
    await connectDB(); 
  } catch (err) { 
    console.error(`Could not connect to MongoDB: ${err.message}`); 
    const hint = describeDbError(err); 
    if (hint) console.error(`Hint: ${hint}`); 
    process.exit(1); 
  } 
 
  // 2. Only now start accepting requests 
  server = app.listen(config.PORT, () => { 
    console.log( 
      `Server running in ${config.NODE_ENV} mode on http://localhost:${config.PORT}` 
    ); 
    console.log(`Health check: http://localhost:${config.PORT}/api/health`); 
 
    // 3. Background job: cancel UPI orders that were never paid 
    startExpiryJob(); 
  }); 
 
  server.on("error", (err) => { 
    if (err.code === "EADDRINUSE") { 
      console.error(`Port ${config.PORT} is already in use.`); 
      console.error("Stop the other program or change PORT in .env."); 
    } else { 
      console.error("Server error:", err); 
    } 
    shutdown("Startup error", 1); 
  }); 
} 
 
// Ctrl + C and hosting platforms' stop signals 
process.on("SIGINT", () => shutdown("SIGINT received")); 
process.on("SIGTERM", () => shutdown("SIGTERM received")); 
 
// Safety nets: log, then shut down instead of running in a broken state 
process.on("unhandledRejection", (reason) => { 
  console.error("Unhandled promise rejection:", reason); 
  shutdown("Unhandled rejection", 1); 
}); 
 
process.on("uncaughtException", (err) => { 
  console.error("Uncaught exception:", err); 
  shutdown("Uncaught exception", 1); 
}); 
 
start();