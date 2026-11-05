const { matchedData } = require("express-validator"); 
const Product = require("../models/Product"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
const { DEFAULT_PAGE_SIZE } = require("../config/constants"); 
const { uploadImageBuffer, deleteImage } = require("../utils/cloudinaryUpload"); 
 
// Each sort name the visitor may use maps to a fixed MongoDB sort. 
// The visitor never supplies a MongoDB sort object. The _id at the end 
// keeps the order stable when two products tie (important for paging). 
// Keep these names in sync with PRODUCT_SORT_KEYS in constants.js. 
const SORT_OPTIONS = { 
  newest: { createdAt: -1, _id: -1 }, 
  oldest: { createdAt: 1, _id: 1 }, 
  price_asc: { price: 1, _id: 1 }, 
  price_desc: { price: -1, _id: 1 }, 
  name_asc: { name: 1, _id: 1 }, 
  name_desc: { name: -1, _id: 1 }, 
}; 
 
// Makes text safe to use inside a regular expression, 
// so a search for ".*" means the characters ".*". 
function escapeRegex(text) { 
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); 
} 
 
function isAdmin(req) { 
  return Boolean(req.user && req.user.role === "admin"); 
} 
 
// GET /api/products 
// Public. Query: search, category, minPrice, maxPrice, sort, page, limit 
// (admins can also send includeInactive=true) 
const listProducts = asyncHandler(async (req, res) => { 
  // matchedData returns ONLY the query values that passed validation, 
  // already converted to numbers, booleans and so on. 
  const q = matchedData(req, { locations: ["query"] }); 
 
  const page = q.page || 1; 
  const limit = q.limit || DEFAULT_PAGE_SIZE; 
  const sortKey = q.sort || "newest"; 
 
  if ( 
    q.minPrice !== undefined && 
    q.maxPrice !== undefined && 
    q.minPrice > q.maxPrice 
  ) { 
    throw new AppError("minPrice cannot be greater than maxPrice.", 400); 
  } 
 
  // The filter is built here, one safe piece at a time. 
  // Nothing from the URL is ever used as a MongoDB filter directly. 
  const filter = {}; 
 
  // Visitors only see active products. Admins may ask for all. 
  if (!(isAdmin(req) && q.includeInactive)) { 
    filter.isActive = true; 
  } 
 
  // q.category is guaranteed to be plain text by the validation rules 
  if (q.category) filter.category = q.category; 
 
  if (q.minPrice !== undefined || q.maxPrice !== undefined) { 
    filter.price = {}; 
    if (q.minPrice !== undefined) filter.price.$gte = q.minPrice; 
    if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice; 
  } 
 
  if (q.search) { 
    const pattern = new RegExp(escapeRegex(q.search), "i"); 
    filter.$or = [{ name: pattern }, { description: pattern }]; 
  } 
 
  const query = Product.find(filter) 
    .sort(SORT_OPTIONS[sortKey] || SORT_OPTIONS.newest) 
    .skip((page - 1) * limit) 
    .limit(limit) 
    .select("-__v") 
    .lean(); 
 
  // Sort names case-insensitively ("apple" next to "Apple") 
  if (sortKey.startsWith("name_")) { 
    query.collation({ locale: "en", strength: 2 }); 
  } 
 
  const [products, total] = await Promise.all([ 
    query, 
    Product.countDocuments(filter), 
  ]); 
 
  const totalPages = Math.ceil(total / limit); 
 
  res.status(200).json({ 
    success: true, 
    data: products, 
    pagination: { 
      page, 
      limit, 
      total, 
      totalPages, 
      hasNextPage: page < totalPages, 
      hasPrevPage: page > 1, 
    }, 
  }); 
}); 
 
// GET /api/products/categories 
// Public. The category names the shop currently uses. 
const getCategories = asyncHandler(async (req, res) => { 
  const categories = await Product.distinct("category", { isActive: true }); 
  categories.sort((a, b) => a.localeCompare(b)); 
  res.status(200).json({ success: true, data: categories }); 
}); 
 
// GET /api/products/:id 
// Public. Hidden products are shown to admins only. 
const getProduct = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  const product = await Product.findById(id).select("-__v"); 
 
  if (!product || (!product.isActive && !isAdmin(req))) { 
    throw new AppError("Product not found.", 404); 
  } 
 
  res.status(200).json({ success: true, data: product }); 
}); 
 
// POST /api/products   (admin only) 
// The image is added afterwards with POST /api/products/:id/image 
const createProduct = asyncHandler(async (req, res) => { 
  // Only fields that have a validation rule get through. Anything 
  // else in the body (_id, createdAt, image...) is ignored. 
  const data = matchedData(req, { locations: ["body"] }); 
 
  const product = await Product.create(data); 
 
  res.status(201).json({ success: true, data: product }); 
}); 
 
// PUT /api/products/:id   (admin only) 
// Send only the fields you want to change. 
const updateProduct = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
  const changes = matchedData(req, { locations: ["body"] }); 
 
  if (Object.keys(changes).length === 0) { 
    throw new AppError("Send at least one field to update.", 400); 
  } 
 
  const product = await Product.findById(id); 
  if (!product) throw new AppError("Product not found.", 404); 
 
  // save() runs the model's validation rules again 
  product.set(changes); 
  await product.save(); 
 
  res.status(200).json({ success: true, data: product }); 
}); 
 
// DELETE /api/products/:id   (admin only) 
const deleteProduct = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  const product = await Product.findByIdAndDelete(id); 
  if (!product) throw new AppError("Product not found.", 404); 
 
  // Remove the picture from Cloudinary too (never throws) 
  if (product.image && product.image.publicId) { 
    await deleteImage(product.image.publicId); 
  } 
 
  res.status(200).json({ 
    success: true, 
    message: "Product deleted.", 
    data: { _id: product._id }, 
  }); 
}); 
 
// POST /api/products/:id/image   (admin only) 
// Multipart form with one file in the field "image". By the time this 
// runs, middleware/upload.js has checked size and type and put the 
// file in memory as req.file.buffer. 
const uploadProductImage = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  // Check the product exists BEFORE uploading, so we never upload 
  // a picture for a product that is not there. 
  const product = await Product.findById(id); 
  if (!product) throw new AppError("Product not found.", 404); 
 
  const oldPublicId = product.image && product.image.publicId; 
 
  // 1. Send the file to Cloudinary 
  const uploaded = await uploadImageBuffer(req.file.buffer); 
 
  // 2. Save its address in MongoDB. If that fails, remove the new 
  //    image again so nothing is left behind. 
  product.image = { 
    url: uploaded.secure_url, 
    publicId: uploaded.public_id, 
  }; 
  try { 
    await product.save(); 
  } catch (err) { 
    await deleteImage(uploaded.public_id); 
    throw err; 
  } 
 
  // 3. Delete the previous picture from Cloudinary (never throws) 
  if (oldPublicId) await deleteImage(oldPublicId); 
 
  res.status(200).json({ success: true, data: product }); 
}); 
 
// DELETE /api/products/:id/image   (admin only) 
const deleteProductImage = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  const product = await Product.findById(id); 
  if (!product) throw new AppError("Product not found.", 404); 
 
  const oldPublicId = product.image && product.image.publicId; 
  const hasImage = Boolean( 
    product.image && (product.image.url || product.image.publicId) 
  ); 
  if (!hasImage) throw new AppError("This product has no image.", 404); 
 
  product.image = { url: "", publicId: "" }; 
  await product.save(); 
 
  if (oldPublicId) await deleteImage(oldPublicId); 
 
  res.status(200).json({ success: true, data: product }); 
}); 
 
module.exports = { 
  listProducts, 
  getCategories, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  uploadProductImage, 
  deleteProductImage, 
}; 
