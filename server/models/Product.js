const mongoose = require("mongoose"); 
const { 
  isWholeNumber, 
  hasAtMostTwoDecimals, 
  isHttpsUrlOrEmpty, 
} = require("../utils/validators"); 
 
const MAX_PRICE = 1000000; 
const MAX_STOCK = 1000000; 
 
const productSchema = new mongoose.Schema( 
  { 
    name: { 
      type: String, 
      required: [true, "Product name is required."], 
      trim: true, 
      minlength: [2, "Name must be at least 2 characters."], 
      maxlength: [120, "Name cannot be more than 120 characters."], 
    }, 
    description: { 
      type: String, 
      required: [true, "Description is required."], 
      trim: true, 
      maxlength: [2000, "Description is too long (max 2000)."], 
    }, 
    price: { 
      type: Number, 
      required: [true, "Price is required."], 
      min: [0.01, "Price must be more than 0."], 
      max: [MAX_PRICE, "Price is too high."], 
      validate: { 
        validator: hasAtMostTwoDecimals, 
        message: "Price can have at most 2 decimal places.", 
      }, 
    }, 
    // A plain text label, like "Electronics" 
    category: { 
      type: String, 
      required: [true, "Category is required."], 
      trim: true, 
      minlength: [2, "Category must be at least 2 characters."], 
      maxlength: [50, "Category cannot be more than 50 characters."], 
    }, 
    stock: { 
      type: Number, 
      default: 0, 
      min: [0, "Stock cannot be negative."], 
      max: [MAX_STOCK, "Stock is too high."], 
      validate: { 
        validator: isWholeNumber, 
        message: "Stock must be a whole number.", 
      }, 
    }, 
    // Cloudinary gives us both values when an image is uploaded. 
    image: { 
      url: { 
        type: String, 
        trim: true, 
        default: "", 
        validate: { 
          validator: isHttpsUrlOrEmpty, 
          message: "Image URL must start with https://", 
        }, 
      }, 
      // Needed later to delete the image from Cloudinary 
      publicId: { type: String, trim: true, default: "" }, 
    }, 
    // false = hidden from the shop but kept in the database 
    isActive: { type: Boolean, default: true }, 
  }, 
  { timestamps: true } 
); 
 
// Search by words in the name and description 
productSchema.index({ name: "text", description: "text" }); 
// Fast filtering by category 
productSchema.index({ category: 1 }); 
// Fast "newest visible products first" lists 
productSchema.index({ isActive: 1, createdAt: -1 }); 
 
module.exports = mongoose.model("Product", productSchema);