// Keep these in sync with the server (constants.js). 
export const MAX_IMAGE_MB = 5; 
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]; 
// Cloudinary can resize and compress an image just by changing its 
// address, so a small card does not download the full-size picture: 
//   .../image/upload/v123/folder/pic.jpg 
//   .../image/upload/f_auto,q_auto,c_limit,w_600/v123/folder/pic.jpg 
// f_auto = best format for the browser, q_auto = smart compression, 
// c_limit,w_600 = at most 600 pixels wide. 
// Any other address is returned unchanged. 
export function optimizeImage(url, width = 600) { 
if (!url || typeof url !== "string") return ""; 
 
  const marker = "/image/upload/"; 
  const isCloudinary = url.startsWith("https://res.cloudinary.com/"); 
  if (!isCloudinary || !url.includes(marker)) return url; 
 
  return url.replace(marker, `${marker}f_auto,q_auto,c_limit,w_${width}/`); 
} 
 
// Quick checks in the browser before uploading. 
// Returns an error message, or "" when the file looks fine. 
// (The server checks everything again. This is only for speed.) 
export function validateImageFile(file) { 
  if (!file) return "Choose an image first."; 
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { 
    return "Only JPG, PNG or WebP images are allowed."; 
  } 
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) { 
    return `The image is too large. The maximum size is ${MAX_IMAGE_MB} MB.`; 
  } 
  return ""; 
}