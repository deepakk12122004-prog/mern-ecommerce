const { v2: cloudinary } = require("cloudinary"); 
const { 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET, 
  CLOUDINARY_FOLDER, 
  isCloudinaryConfigured, 
} = require("./env"); 
 
// Connect the SDK to your account (only if all three values are set) 
if (isCloudinaryConfigured) { 
  cloudinary.config({ 
    cloud_name: CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET, 
    secure: true, // always use https:// URLs 
  }); 
} 
 
module.exports = { cloudinary, isCloudinaryConfigured, CLOUDINARY_FOLDER };