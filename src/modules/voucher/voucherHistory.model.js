import mongoose from "mongoose";

const voucherUsageHistorySchema = new mongoose.Schema(
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
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: [true, "Discount amount is required"],
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["Completed", "Cancelled", "Pending", "Processing"],
      default: "Pending",
    },
    voucherStatus: {
      type: String,
      enum: ["Consumed", "Refunded"],
      default: "Consumed",
    },
  },
  {
    timestamps: true,
  },
);

voucherUsageHistorySchema.index({ voucherId: 1, userId: 1 });
voucherUsageHistorySchema.index({ orderId: 1 });
voucherUsageHistorySchema.index({ canteenId: 1 });

export const VoucherUsageHistory = mongoose.model(
  "VoucherUsageHistory",
  voucherUsageHistorySchema,
);
