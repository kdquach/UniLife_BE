import mongoose from "mongoose";
import crypto from "crypto";
import { generateQRToken } from "../../utils/qrToken.js";

// Embedded order item schema
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    note: {
      type: String,
      maxlength: [200, "Note cannot exceed 200 characters"],
    },
  },
  { _id: false },
);

// Embedded payment schema
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cash", "momo", "vnpay", "sepay", "balance", "bank_transfer"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    amount: {
      type: Number,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
  },
  { _id: false },
);

// Embedded pickup QR code schema
const pickupQRCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
    },
    expireAt: {
      type: Date,
    },
    scannedAt: {
      type: Date,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "received",
        "cancelled",
      ],
      default: "pending",
    },
    // Price breakdown
    subTotal: {
      type: Number,
      required: [true, "Sub total is required"],
      min: [0, "Sub total cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    // Voucher applied
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
    },
    voucherCode: {
      type: String,
    },
    // Embedded order items
    items: [orderItemSchema],
    // Embedded payment info
    payment: paymentSchema,
    // Embedded pickup QR code
    pickupQRCode: pickupQRCodeSchema,
    // Order details
    note: {
      type: String,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    estimatedTime: {
      type: Number, // in minutes
    },
    preparedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      maxlength: [500, "Cancel reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ canteenId: 1 });
orderSchema.index({ staffId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "pickupQRCode.code": 1 });
orderSchema.index({ orderNumber: 1 });

// Dashboard aggregation indexes
orderSchema.index({ canteenId: 1, createdAt: -1 });
orderSchema.index({ canteenId: 1, status: 1, createdAt: -1 });
orderSchema.index({ canteenId: 1, 'payment.status': 1, createdAt: -1 });
orderSchema.index({ canteenId: 1, userId: 1, createdAt: -1 });

// Generate order number and pickup QR code before saving
orderSchema.pre("save", async function (next) {
  // Generate order number
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }

  // Generate pickup QR code as JWT token (expires at end-of-day 23:59:59)
  if (
    this.isNew ||
    (this.isModified("status") && this.status === "confirmed")
  ) {
    if (!this.pickupQRCode || !this.pickupQRCode.code) {
      // Short-lived initial QR (5 minutes) for security
      // User's FE will refresh it to 75s when they open the QR view
      const expireAt = new Date(Date.now() + 5 * 60 * 1000); 

      this.pickupQRCode = {
        code: generateQRToken(this._id.toString(), this.orderNumber),
        expireAt: expireAt,
      };
    }
  }

  // Set timestamps based on status changes
  if (this.isModified("status")) {
    if (this.status === "ready") {
      this.preparedAt = new Date();
    } else if (this.status === "completed") {
      this.completedAt = new Date();
    } else if (this.status === "received") {
      this.receivedAt = new Date();
    } else if (this.status === "cancelled") {
      this.cancelledAt = new Date();
    }
  }

  next();
});

// Calculate total amount from items
orderSchema.methods.calculateTotal = function () {
  this.subTotal = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  this.totalAmount = this.subTotal - (this.discount || 0);
  return this.totalAmount;
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
