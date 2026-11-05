const mongoose = require("mongoose"); 
 
// True when the database cannot do transactions 
// (for example a local, single-server MongoDB). 
function isTransactionUnsupported(err) { 
  const message = String((err && err.message) || ""); 
  return /Transaction numbers are only allowed/i.test(message); 
} 
 
// Runs work(session) as ONE all-or-nothing transaction: if anything 
// inside throws, every database change made inside is rolled back. 
// 
// If the database does not support transactions, it runs work(null) 
// instead. Then the work function must undo its own changes on failure. 
async function runInTransaction(work) { 
  let session = null; 
  try { 
    session = await mongoose.startSession(); 
    let result; 
    await session.withTransaction(async () => { 
      // This function may run again if MongoDB asks for a retry, 
      // so it must not depend on anything outside itself. 
      result = await work(session); 
    }); 
    return result; 
  } catch (err) { 
    if (isTransactionUnsupported(err)) { 
      console.warn( 
        "Transactions are not supported by this database. Using fallback." 
      ); 
      return work(null); 
    } 
    throw err; 
  } finally { 
    if (session) await session.endSession(); 
  } 
} 
 
module.exports = { runInTransaction };