const path = require("path"); 
const dotenv = require("dotenv"); 
// Load server/.env (explicit path, works from any terminal folder) 
dotenv.config({ path: path.join(__dirname, "..", ".env") }); 
const NODE_ENV = process.env.NODE_ENV || "development"; 
const isProduction = NODE_ENV === "production"; 
const PORT = Number(process.env.PORT) || 5000; 
// MongoDB connection string. It contains a password, so it lives 
// only in .env and must never be printed or committed. 
const MONGO_URI = (process.env.MONGO_URI || "").trim(); 
// CLIENT_URL can hold several addresses separated by commas. 
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"; 
const clientOrigins = CLIENT_URL.split(",") 
.map((url) => url.trim().replace(/\/+$/, "")) 
.filter(Boolean); 
// ---- Authentication ---- 
// The secret signs the login token. Without it anyone could forge one, 
// so the server refuses to start if it is missing or weak. 
const JWT_SECRET = (process.env.JWT_SECRET || "").trim(); 
if (JWT_SECRET.length < 32) { 
throw new Error( 
"JWT_SECRET is missing or too short. " + 
"Add a random string of 32+ characters to server/.env" 
); 
} 
const JWT_EXPIRES_DAYS = Number(process.env.JWT_EXPIRES_DAYS) || 7; 
// Cookie rules. 
// Development: "lax" works (localhost:5173 and localhost:5000 
//   count as the same site). 
// Production: the React app and the API are usually on different 
//   sites, so SameSite must be "none", which requires Secure (HTTPS). 
const sameSiteInput = (process.env.COOKIE_SAME_SITE || "").toLowerCase(); 
const defaultSameSite = isProduction ? "none" : "lax"; 
const cookieSameSite = ["lax", "strict", "none"].includes(sameSiteInput) 
? sameSiteInput 
: defaultSameSite; 
const cookieSecure = isProduction || cookieSameSite === "none"; 
// ---- Cloudinary (product image storage) ---- 
// These stay on the server. The browser never sees them. 
const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || 
"").trim(); 
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim(); 
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET || 
"").trim(); 
const CLOUDINARY_FOLDER = ( 
process.env.CLOUDINARY_FOLDER || "mern-ecommerce/products" 
) 
.trim() 
.replace(/^\/+|\/+$/g, ""); 
const isCloudinaryConfigured = Boolean( 
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && 
CLOUDINARY_API_SECRET 
); 
 
// ---- Razorpay (online payments: UPI) ---- 
// The Key Id is public (the browser needs it to open the payment 
// window). The Key Secret must NEVER leave the server. 
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim(); 
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim(); 
 
if (Boolean(RAZORPAY_KEY_ID) !== Boolean(RAZORPAY_KEY_SECRET)) { 
  throw new Error( 
    "Set BOTH RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env, " + 
      "or neither." 
  ); 
} 
if ( 
  RAZORPAY_KEY_ID && 
  !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(RAZORPAY_KEY_ID) 
) { 
  throw new Error( 
    "RAZORPAY_KEY_ID should look like rzp_test_xxxxxxxx " + 
      "(or rzp_live_xxxxxxxx for real payments)." 
  ); 
} 
const isRazorpayConfigured = Boolean(RAZORPAY_KEY_ID && 
RAZORPAY_KEY_SECRET); 
 
// The webhook secret is a different secret from the key secret. 
// You choose it yourself and enter the same text in Razorpay's 
// Dashboard (Settings > Webhooks). 
const RAZORPAY_WEBHOOK_SECRET = ( 
  process.env.RAZORPAY_WEBHOOK_SECRET || "" 
).trim(); 
if (RAZORPAY_WEBHOOK_SECRET && RAZORPAY_WEBHOOK_SECRET.length < 12) { 
  throw new Error( 
    "RAZORPAY_WEBHOOK_SECRET is too short. Use a random text of 12+ characters." 
  ); 
} 
const isWebhookConfigured = Boolean(RAZORPAY_WEBHOOK_SECRET); 
 
// ---- Unpaid UPI orders ---- 
// A UPI order not paid within this many minutes is cancelled by a 
// background job, and its stock goes back on sale. 
const UPI_PAYMENT_WINDOW_MINUTES = Math.max( 
  5, 
  Number(process.env.UPI_PAYMENT_WINDOW_MINUTES) || 30 
); 
// How often the job looks for expired orders 
const EXPIRY_JOB_INTERVAL_MINUTES = Math.max( 
  1, 
  Number(process.env.EXPIRY_JOB_INTERVAL_MINUTES) || 5 
); 
 
module.exports = { 
  NODE_ENV, 
  PORT, 
  MONGO_URI, 
  clientOrigins, 
  JWT_SECRET, 
  JWT_EXPIRES_DAYS, 
  cookieSameSite, 
  cookieSecure, 
  isProduction, 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET, 
  CLOUDINARY_FOLDER, 
  isCloudinaryConfigured, 
  RAZORPAY_KEY_ID, 
  RAZORPAY_KEY_SECRET, 
  isRazorpayConfigured, 
  RAZORPAY_WEBHOOK_SECRET, 
  isWebhookConfigured, 
  UPI_PAYMENT_WINDOW_MINUTES, 
  EXPIRY_JOB_INTERVAL_MINUTES, 
};  