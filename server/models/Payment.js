const mongoose = require("mongoose"); 
const { PAYMENT_ATTEMPT_STATUSES } = require("../config/constants"); 
const { isWholeNumber } = require("../utils/validators"); 
 
// A short note about a failed or cancelled attempt. 
// Only a few text fields are kept, and each is length-limited. 
const eventSchema = new mongoose.Schema( 
  { 
    kind: { type: String, enum: ["failed", "cancelled"], required: true }, 
    code: { type: String, maxlength: 60 }, 
    description: { type: String, maxlength: 200 }, 
    reason: { type: String, maxlength: 60 }, 
    step: { type: String, maxlength: 60 }, 
    at: { type: Date, default: Date.now }, 
  }, 
  { _id: false } 
); 
 
// One document = one Razorpay order created for one of our orders, 
// together with its payment attempts. It stores ids, the amount and 
// timestamps, and NEVER any UPI id, PIN, or banking details. 
const paymentSchema = new mongoose.Schema( 
  { 
    order: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order", 
      required: [true, "Order is required."], 
    }, 
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User is required."], 
    }, 
    provider: { type: String, enum: ["razorpay"], default: "razorpay" }, 
    method: { type: String, enum: ["UPI"], default: "UPI" }, 
 
    // Razorpay works in paise (1 rupee = 100 paise), as a whole number 
    amountPaise: { 
      type: Number, 
      required: [true, "Amount is required."], 
      min: [100, "The minimum online payment is 1 rupee."], 
      validate: { 
        validator: isWholeNumber, 
        message: "Amount must be a whole number of paise.", 
      }, 
    }, 
    currency: { type: String, enum: ["INR"], default: "INR" }, 
 
    // Razorpay's ids (transaction ids) 
    razorpayOrderId: { 
      type: String, 
      required: [true, "Razorpay order id is required."], 
      trim: true, 
      unique: true, 
    }, 
    razorpayPaymentId: { type: String, trim: true }, 
    // The signature we verified (kept for audit). Hidden from queries. 
    razorpaySignature: { type: String, trim: true, select: false }, 
 
    status: { 
      type: String, 
      enum: { values: PAYMENT_ATTEMPT_STATUSES, message: "Invalid status." }, 
      default: "created", 
    }, 
    events: { type: [eventSchema], default: [] }, 
    verifiedAt: { type: Date }, 
 
    // true = genuine money arrived, but the order could not accept it 
    // (for example it was cancelled meanwhile). An admin must refund it. 
    needsRefund: { type: Boolean, default: false }, 
    // When an admin confirmed that such a payment was refunded 
    refundedAt: { type: Date }, 
  }, 
  { 
    timestamps: true, 
    toJSON: { 
      transform(doc, ret) { 
        delete ret.__v; 
        delete ret.razorpaySignature; 
        return ret; 
      }, 
    }, 
  } 
); 
 
// All attempts for an order, newest first 
paymentSchema.index({ order: 1, createdAt: -1 }); 
// One Razorpay payment id can only ever belong to ONE payment record 
paymentSchema.index( 
  { razorpayPaymentId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { razorpayPaymentId: { $type: "string" } }, 
  } 
); 
 
module.exports = mongoose.model("Payment", paymentSchema);