import api from "./axios"; 
 
// Every function returns the user object from the server: 
// { _id, name, email, role, createdAt }  (never a password) 
export async function registerUser(name, email, password) { 
const res = await api.post("/auth/register", { name, email, password }); 
return res.data.data; 
} 
export async function loginUser(email, password) { 
const res = await api.post("/auth/login", { email, password }); 
return res.data.data; 
} 
export async function logoutUser() { 
await api.post("/auth/logout"); 
} 
// Asks the server "who is logged in?". The browser sends the cookie 
// automatically. Throws a 401 error if nobody is logged in. 
export async function getCurrentUser(signal) { 
const res = await api.get("/auth/me", { signal, timeout: 8000 }); 
return res.data.data; 
} 
// TEMPORARY: changes the name in the browser only. The server has no 
// "update profile" endpoint yet, so a refresh brings the old name back. 
export async function updateUserName(currentUser, name) { 
return { ...currentUser, name }; 
}
 
