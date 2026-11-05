const multer = require("multer"); 
const AppError = require("../utils/AppError"); 
const { MAX_IMAGE_MB, ALLOWED_IMAGE_TYPES } = require("../config/constants"); 
 
const upload = multer({ 
  // Keep the file in memory only. Servers like Render erase their disk 
  // on every deploy, so files must never be stored there. 
  storage: multer.memoryStorage(), 
  limits: { 
    fileSize: MAX_IMAGE_MB * 1024 * 1024, 
    files: 1, 
    fields: 5, 
  }, 
  // First check: the type the browser says the file has. 
  // (The browser can be lied to, so we also check the real bytes below.) 
  fileFilter(req, file, cb) { 
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) { 
      return cb( 
        new AppError("Only JPG, PNG or WebP images are allowed.", 415) 
      ); 
    } 
    return cb(null, true); 
  }, 
}); 
 
// Every image file starts with a few fixed bytes (a "signature"). 
// Reading them tells us what the file REALLY is. 
function detectImageType(buffer) { 
  if (!buffer || buffer.length < 12) return null; 
 
  // JPEG: FF D8 FF 
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) { 
    return "image/jpeg"; 
  } 
 
  // PNG: 89 50 4E 47 0D 0A 1A 0A 
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]; 
  if (png.every((byte, index) => buffer[index] === byte)) { 
    return "image/png"; 
  } 
 
  // WebP: "RIFF" .... "WEBP" 
  const isRiff = buffer.toString("ascii", 0, 4) === "RIFF"; 
  const isWebp = buffer.toString("ascii", 8, 12) === "WEBP"; 
  if (isRiff && isWebp) return "image/webp"; 
 
  return null; 
} 
 
// Runs after multer has read the file into req.file 
function requireValidImage(req, res, next) { 
  if (!req.file) { 
    return next( 
      new AppError('Please choose an image (form field "image").', 400) 
    ); 
  } 
 
  const detected = detectImageType(req.file.buffer); 
  if (!detected || !ALLOWED_IMAGE_TYPES.includes(detected)) { 
    return next( 
      new AppError("That file is not a valid JPG, PNG or WebP image.", 415) 
    ); 
  } 
 
  req.file.detectedType = detected; 
  return next(); 
} 
 
// Use in a route AFTER protect and adminOnly, so strangers cannot 
// make the server read large files: 
//   router.post("/", protect, adminOnly, ...uploadSingleImage, handler) 
const uploadSingleImage = [upload.single("image"), requireValidImage]; 
 
module.exports = { uploadSingleImage };