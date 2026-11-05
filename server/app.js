const express = require("express"); 
const cors = require("cors"); 
const helmet = require("helmet"); 
const cookieParser = require("cookie-parser"); 
 
const config = require("./config/env"); 
const routes = require("./routes"); 
const notFound = require("./middleware/notFound"); 
const errorHandler = require("./middleware/errorHandler"); 
 
const app = express(); 
 
// On Render/Heroku the app sits behind a proxy. This lets Express see 
// the real visitor IP and HTTPS (needed for rate limiting and secure 
// cookies). 
if (config.isProduction) app.set("trust proxy", 1); 
 
// 1. Security headers 
app.use(helmet()); 
 
// 2. CORS: only our React frontend may call the API from a browser. 
//    credentials: true lets the browser send the login cookie. 
//    (Razorpay's webhook calls come from their servers, with no 
//    browser origin, so CORS does not apply to them.) 
app.use( 
  cors({ 
    origin(origin, callback) { 
      if (!origin || config.clientOrigins.includes(origin)) { 
        return callback(null, true); 
      } 
      return callback(null, false); 
    }, 
    credentials: true, 
  }) 
); 
 
// 3. The Razorpay webhook keeps its RAW body (a Buffer), because its 
//    signature is calculated over the exact bytes. This line MUST come 
//    before express.json(). 
app.use( 
  "/api/payments/razorpay/webhook", 
  express.raw({ type: "application/json", limit: "100kb" }) 
); 
 
// 4. Read JSON request bodies into req.body (max 10 KB) 
app.use(express.json({ limit: "10kb" })); 
 
// 5. Read cookies into req.cookies (this is how we see the login token) 
app.use(cookieParser()); 
 
// 6. All API routes live under /api 
app.use("/api", routes); 
 
// 7. These two MUST come last 
app.use(notFound); 
app.use(errorHandler); 
 
module.exports = app;