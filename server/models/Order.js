const mongoose = require("mongoose"); 
const { 
  ORDER_STATUSES, 
  ORDER_STATUS_FLOW, 
  PAYMENT_METHODS, 
  PAYMENT_STATUSES, 
  PAYMENT_STATUS_FLOW, 
  MAX_ITEM_QUANTITY, 
  MAX_LINE_ITEMS, 
} = require("../config/constants"); 
const { 
  isWholeNumber, 
  hasAtMostTwoDecimals, 
  roundMoney, 
  hasUniqueProducts, 
} = require("../utils/validators"); 
 
// Builds the rules for a money field (never negative, 2 decimals). 
// All money is in Indian Rupees, stored as plain numbers. 
function moneyField(label) { 
  return { 
    type: Number, 
    required: [true, `${label} is required.`], 
    min: [0, `${label} cannot be negative.`], 
    validate: { 
      validator: hasAtMostTwoDecimals, 
      message: `${label} can have at most 2 decimal places.`, 
    }, 
  }; 
} 
 
// Builds the rules for a required text field 
function requiredText(label, max) { 
  return { 
    type: String, 
    required: [true, `${label} is required.`], 
    trim: true, 
    maxlength: [max, `${label} is too long.`], 
  }; 
} 
 
// One line of an order. name, price and image are COPIES of the 
// product as it was at purchase time (a "snapshot"), so changing 
// the product later never changes old orders. 
const orderItemSchema = new mongoose.Schema( 
  { 
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: [true, "Product is required."], 
    }, 
    name: requiredText("Item name", 120), 
    price: moneyField("Item price"), 
    image: { type: String, default: "" }, 
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
 
const shippingAddressSchema = new mongoose.Schema( 
  { 
    fullName: requiredText("Full name", 100), 
    address: requiredText("Address", 200), 
    city: requiredText("City", 100), 
    postalCode: requiredText("Postal code", 20), 
    country: requiredText("Country", 100), 
    phone: { 
      ...requiredText("Phone", 15), 
      match: [/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number."], 
    }, 
  }, 
  { _id: false } 
); 
 
const orderSchema = new mongoose.Schema( 
  { 
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User is required."], 
    }, 
    items: { 
      type: [orderItemSchema], 
      validate: [ 
        { 
          validator: (items) => items.length > 0, 
          message: "An order needs at least one item.", 
        }, 
        { 
          validator: (items) => items.length <= MAX_LINE_ITEMS, 
          message: "Too many different products in one order.", 
        }, 
        { 
          validator: hasUniqueProducts, 
          message: "Each product can appear only once in an order.", 
        }, 
      ], 
    }, 
    shippingAddress: { 
      type: shippingAddressSchema, 
      required: [true, "Shipping address is required."], 
    }, 
    // "COD" (cash on delivery) or "UPI" (online, through Razorpay) 
    paymentMethod: { 
      type: String, 
      enum: { 
        values: PAYMENT_METHODS, 
        message: "Unsupported payment method.", 
      }, 
      default: "COD", 
    }, 
    // Has the money been received? Always starts as "pending". 
    // Only the server changes it (admin action, or a verified 
    // payment from the gateway). The browser can never set it. 
    paymentStatus: { 
      type: String, 
      enum: { 
        values: PAYMENT_STATUSES, 
        message: "Invalid payment status.", 
      }, 
      default: "pending", 
    }, 
    // When the payment was received (set when paymentStatus becomes paid) 
    paidAt: { type: Date }, 
    // The gateway's payment id (for example "pay_Abc123..."), set only 
    // after the payment signature has been verified on the server. 
    transactionId: { type: String, trim: true, maxlength: 100 }, 
    // These three are calculated by the SERVER, never taken 
    // from the browser. 
    itemsPrice: moneyField("Items price"), 
    shippingPrice: moneyField("Shipping price"), 
    totalPrice: moneyField("Total price"), 
    status: { 
      type: String, 
      enum: { values: ORDER_STATUSES, message: "Invalid order status." }, 
      default: "pending", 
    }, 
    // A random id the browser creates for ONE checkout attempt. 
    // The same key can never create two orders (see the index below). 
    idempotencyKey: { 
      type: String, 
      trim: true, 
      maxlength: [100, "Idempotency key is too long."], 
    }, 
  }, 
  { 
    timestamps: true, 
    toJSON: { 
      // Internal fields never go to the browser 
      transform(doc, ret) { 
        delete ret.__v; 
        delete ret.idempotencyKey; 
        return ret; 
      }, 
    }, 
  } 
); 
 
// Safety net: the totals must add up. This cannot know the real 
// product prices (the controller reads those from the database), 
// but it catches any order whose own numbers do not match. 
orderSchema.pre("validate", function () { 
  const { items, itemsPrice, shippingPrice, totalPrice } = this; 
  const numbers = [itemsPrice, shippingPrice, totalPrice]; 
  const allNumbers = numbers.every((n) => typeof n === "number"); 
  if (!items || items.length === 0 || !allNumbers) return; 
 
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0); 
 
  if (roundMoney(itemsTotal) !== roundMoney(itemsPrice)) { 
    this.invalidate("itemsPrice", "Items price does not match the items."); 
  } 
  if (roundMoney(itemsPrice + shippingPrice) !== roundMoney(totalPrice)) { 
    this.invalidate("totalPrice", "Total must equal items plus shipping."); 
  } 
}); 
 
// order.canChangeStatusTo("shipped") -> true or false 
orderSchema.methods.canChangeStatusTo = function (newStatus) { 
  const allowed = ORDER_STATUS_FLOW[this.status] || []; 
  return allowed.includes(newStatus); 
}; 
 
// order.canChangePaymentStatusTo("paid") -> true or false 
orderSchema.methods.canChangePaymentStatusTo = function (newStatus) { 
  const allowed = PAYMENT_STATUS_FLOW[this.paymentStatus] || []; 
  return allowed.includes(newStatus); 
}; 
 
// "My orders", newest first 
orderSchema.index({ user: 1, createdAt: -1 }); 
// Admin list filtered by status, newest first 
orderSchema.index({ status: 1, createdAt: -1 }); 
// Admin list of everything, newest first 
orderSchema.index({ createdAt: -1 }); 
// Admin list filtered by payment method and payment status 
orderSchema.index({ paymentMethod: 1, paymentStatus: 1, createdAt: -1 }); 
// The duplicate-order guard: one order per (user, key). 
// "partial" means orders without a key are not affected. 
orderSchema.index( 
  { user: 1, idempotencyKey: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { idempotencyKey: { $type: "string" } }, 
  } 
); 
 
module.exports = mongoose.model("Order", orderSchema); 