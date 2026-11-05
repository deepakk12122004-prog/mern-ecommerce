const { 
  cloudinary, 
  isCloudinaryConfigured, 
  CLOUDINARY_FOLDER, 
} = require("../config/cloudinary"); 
const AppError = require("./AppError"); 
 
// Sends an image (a Buffer held in memory) to Cloudinary. 
// Nothing is ever written to this server's disk. 
// Resolves with Cloudinary's result: { secure_url, public_id, ... } 
function uploadImageBuffer(buffer) { 
  return new Promise((resolve, reject) => { 
    if (!isCloudinaryConfigured) { 
      return reject( 
        new AppError("Image uploads are not set up on this server.", 503) 
      ); 
    } 
 
    const stream = cloudinary.uploader.upload_stream( 
      { 
        folder: CLOUDINARY_FOLDER, 
        resource_type: "image", 
        // Cloudinary checks the format too (a second line of defence) 
        allowed_formats: ["jpg", "png", "webp"], 
        // Store at most 1600x1600 (smaller files, less storage used) 
        transformation: [{ width: 1600, height: 1600, crop: "limit" }], 
      }, 
      (error, result) => { 
        if (error || !result) { 
          // Details stay in the server log, not in the response 
          console.error("Cloudinary upload failed:", error); 
          return reject( 
            new AppError("Could not upload the image. Please try again.", 502) 
          ); 
        } 
        return resolve(result); 
      } 
    ); 
 
    stream.end(buffer); 
  }); 
} 
 
// Deletes an image from Cloudinary. It NEVER throws: a failed cleanup 
// must not break the request. It only touches our own folder, so a 
// wrong value in the database can never delete other images. 
async function deleteImage(publicId) { 
  if (!publicId || !isCloudinaryConfigured) return; 
  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`)) return; 
 
  try { 
    await cloudinary.uploader.destroy(publicId, { 
      resource_type: "image", 
      invalidate: true, 
    }); 
  } catch (err) { 
    console.error(`Could not delete Cloudinary image ${publicId}:`, err); 
  } 
} 
 
module.exports = { uploadImageBuffer, deleteImage };