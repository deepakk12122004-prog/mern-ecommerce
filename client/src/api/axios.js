 import axios from "axios"; 
// The backend address comes from client/.env (VITE_API_URL). 
const baseURL = 
import.meta.env.VITE_API_URL || 
(import.meta.env.DEV ? "http://localhost:5000/api" : ""); 
if (!baseURL) { 
console.error("VITE_API_URL is not set. API calls will fail."); 
} 
const api = axios.create({ 
baseURL, 
withCredentials: true, // lets the browser send and receive the login cookie 
timeout: 15000, 
headers: { "Content-Type": "application/json" }, 
}); 
// AuthContext registers one function here. It runs when the server 
// says "you are not logged in" (for example, the session expired). 
let unauthorizedHandler = null; 
export function setUnauthorizedHandler(handler) { 
unauthorizedHandler = handler; 
} 
// Turns any Axios error into a plain Error with friendly fields:   
//error.message     - text to show the user 
// error.status      - HTTP status (undefined if no response) 
// error.fieldErrors - { email: "...", password: "..." } from the server 
// error.details     - the server's raw "details" list, if any 
function toApiError(error) { 
const response = error.response; 
const fieldErrors = {}; 
let details = []; 
let message = "Something went wrong. Please try again."; 
if (response) { 
    const data = response.data || {}; 
    if (data.message) message = data.message; 
 
    if (Array.isArray(data.details)) { 
      details = data.details; 
      data.details.forEach((item) => { 
        if (item.field && !fieldErrors[item.field]) { 
          fieldErrors[item.field] = item.message; 
        } 
      }); 
    } 
  } else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") { 
    message = "The server took too long to respond. Please try again."; 
  } else { 
    message = "Cannot reach the server. Check your connection and try again."; 
  } 
 
  const apiError = new Error(message); 
  apiError.status = response ? response.status : undefined; 
  apiError.fieldErrors = fieldErrors; 
  apiError.details = details; 
  return apiError; 
} 
 
api.interceptors.response.use( 
  (response) => response, 
  (error) => { 
    // A cancelled request is not a real error. Pass it through. 
    if (axios.isCancel(error)) return Promise.reject(error); 
 
    const apiError = toApiError(error); 
 
    // A 401 from a normal API call means the session ended. 
    // (401 from /auth/login or /auth/me is expected, so ignore those.) 
    const url = (error.config && error.config.url) || ""; 
    const isAuthCall = url.startsWith("/auth/"); 
    if (apiError.status === 401 && !isAuthCall && unauthorizedHandler) { 
      unauthorizedHandler(); 
    } 
 
    return Promise.reject(apiError); 
  } 
); 
 
export default api; 