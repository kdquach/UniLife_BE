import mongoose from "mongoose";

// Voucher Schema
const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Voucher code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Voucher code cannot exceed 20 characters"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maxDiscount: {
      type: Number,
      min: [0, "Maximum discount cannot be negative"],
    },
    maxUsage: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

voucherSchema.index({ code: 1 });
voucherSchema.index({ startDate: 1, endDate: 1 });
voucherSchema.index({ isActive: 1 });

// Check if voucher is valid
voucherSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (now < this.startDate || now > this.endDate) return false;
  if (this.maxUsage !== null && this.usedCount >= this.maxUsage) return false;
  return true;
};

// Calculate discount
voucherSchema.methods.calculateDiscount = function (orderAmount) {
  if (!this.isValid()) return 0;
  if (orderAmount < this.minOrderAmount) return 0;

  let discount = 0;
  if (this.discountType === "percentage") {
    discount = (orderAmount * this.value) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = this.value;
  }

  return Math.min(discount, orderAmount);
};

// Voucher Usage Schema
const voucherUsageSchema = new mongoose.Schema(
  {
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: [true, "Voucher ID is required"],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    discountAmount: {
      type: Number,
      required: [true, "Discount amount is required"],
    },
  },
  {
    timestamps: true,
  },
);

voucherUsageSchema.index({ voucherId: 1, userId: 1 });
voucherUsageSchema.index({ orderId: 1 });

export const Voucher = mongoose.model("Voucher", voucherSchema);
export const VoucherUsage = mongoose.model("VoucherUsage", voucherUsageSchema);
