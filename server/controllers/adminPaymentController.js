const { matchedData } = require("express-validator"); 
const Payment = require("../models/Payment"); 
const Order = require("../models/Order"); 
const User = require("../models/User"); 
const AppError = require("../utils/AppError"); 
const asyncHandler = require("../utils/asyncHandler"); 
 
const PAGE_SIZE = 10; 
 
// GET /api/admin/payments?status=&refund=needed&page=&limit= 
// Every online payment, with its transaction id and the order and 
// customer it belongs to. 
// 
// "refundNeeded" is true when: 
//   - a genuine payment arrived but the order could not accept it 
//     (needsRefund), or 
//   - a paid order was cancelled and the payment is not refunded yet 
const adminListPayments = asyncHandler(async (req, res) => { 
  const q = matchedData(req, { locations: ["query"] }); 
  const page = q.page || 1; 
  const limit = q.limit || PAGE_SIZE; 
 
  // Values come from fixed lists (checked by the validation rules) 
  const earlyMatch = q.status ? [{ $match: { status: q.status } }] : []; 
  const lateMatch = 
    q.refund === "needed" ? [{ $match: { refundNeeded: true } }] : []; 
 
  const withOrder = [ 
    ...earlyMatch, 
    { 
      $lookup: { 
        from: Order.collection.name, 
        localField: "order", 
        foreignField: "_id", 
        as: "orderDoc", 
      }, 
    }, 
    { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: true } }, 
    { 
      $addFields: { 
        refundNeeded: { 
          $or: [ 
            { $eq: ["$needsRefund", true] }, 
            { 
              $and: [ 
                { $eq: ["$status", "paid"] }, 
                { $eq: ["$orderDoc.status", "cancelled"] }, 
                { $eq: ["$orderDoc.paymentStatus", "paid"] }, 
              ], 
            }, 
          ], 
        }, 
      }, 
    }, 
    ...lateMatch, 
  ]; 
 
  const dataPipeline = [ 
    ...withOrder, 
    { $sort: { createdAt: -1, _id: -1 } }, 
    { $skip: (page - 1) * limit }, 
    { $limit: limit }, 
    { 
      $lookup: { 
        from: User.collection.name, 
        localField: "user", 
        foreignField: "_id", 
        as: "userDoc", 
      }, 
    }, 
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } }, 
    // Only these fields leave the database. (The stored signature is 
    // not in the list, so it is never sent.) 
    { 
      $project: { 
        _id: 1, 
        status: 1, 
        razorpayOrderId: 1, 
        razorpayPaymentId: 1, 
        amountPaise: 1, 
        needsRefund: 1, 
        refundNeeded: 1, 
        verifiedAt: 1, 
        refundedAt: 1, 
        createdAt: 1, 
        order: { 
          _id: "$orderDoc._id", 
          status: "$orderDoc.status", 
          paymentStatus: "$orderDoc.paymentStatus", 
          totalPrice: "$orderDoc.totalPrice", 
        }, 
        user: { 
          _id: "$userDoc._id", 
          name: "$userDoc.name", 
          email: "$userDoc.email", 
        }, 
      }, 
    }, 
  ]; 
 
  const [rows, countRows] = await Promise.all([ 
    Payment.aggregate(dataPipeline), 
    Payment.aggregate([...withOrder, { $count: "n" }]), 
  ]); 
 
  const total = countRows[0] ? countRows[0].n : 0; 
  const totalPages = Math.ceil(total / limit); 
 
  const payments = rows.map((row) => ({ 
    ...row, 
    amount: row.amountPaise / 100, // rupees, for display 
  })); 
 
  res.status(200).json({ 
    success: true, 
    data: payments, 
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
 
// PUT /api/admin/payments/:id/refund-done 
// For a payment flagged "needsRefund": after the admin has refunded the 
// customer in the Razorpay Dashboard, this clears the flag. It sends no 
// money by itself. 
const adminMarkRefundDone = asyncHandler(async (req, res) => { 
  const { id } = matchedData(req, { locations: ["params"] }); 
 
  const updated = await Payment.findOneAndUpdate( 
    { _id: id, needsRefund: true }, 
    { needsRefund: false, refundedAt: new Date() }, 
    { new: true } 
  ); 
 
  if (!updated) { 
    const exists = await Payment.exists({ _id: id }); 
    if (!exists) throw new AppError("Payment not found.", 404); 
    throw new AppError("This payment is not waiting for a refund.", 409); 
  } 
 
  res.status(200).json({ success: true, data: updated }); 
}); 
 
module.exports = { adminListPayments, adminMarkRefundDone };