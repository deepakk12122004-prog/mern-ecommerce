const mongoose = require("mongoose"); 
const { 
  MAX_ITEM_QUANTITY, 
  MAX_LINE_ITEMS, 
} = require("../config/constants"); 
const { isWholeNumber, hasUniqueProducts } = require("../utils/validators"); 
 
// One line in the cart: which product, and how many. 
// No price here on purpose. The price is always read from Product. 
const cartItemSchema = new mongoose.Schema( 
  { 
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: [true, "Product is required."], 
    }, 
    quantity: { 
      type: Number, 
      required: [true, "Quantity is required."], 
      min: [1, "Quantity must be at least 1."], 
      max: [MAX_ITEM_QUANTITY, "Quantity is too high."], 
      validate: { 
        validator: isWholeNumber, 
        message: "Quantity must be a whole number.", 
      }, 
    }, 
  }, 
  { _id: false } 
); 
 
const cartSchema = new mongoose.Schema( 
  { 
    // unique: true = one cart per user 
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User is required."], 
      unique: true, 
    }, 
    items: { 
      type: [cartItemSchema], 
      validate: [ 
        { 
          validator: (items) => items.length <= MAX_LINE_ITEMS, 
          message: "Too many different products in the cart.", 
        }, 
        { 
          validator: hasUniqueProducts, 
          message: "Each product can appear only once in a cart.", 
        }, 
      ], 
    }, 
  }, 
  { timestamps: true } 
); 
 
module.exports = mongoose.model("Cart", cartSchema);