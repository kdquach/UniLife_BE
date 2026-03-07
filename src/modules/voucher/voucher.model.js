import mongoose from "mongoose";

const voucherChangeLogSchema = new mongoose.Schema(
  {
    field: { type: String },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { _id: false },
);

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Voucher code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9_-]{4,20}$/,
        "Code must be 4-20 alphanumeric characters, dashes or underscores",
      ],
    },
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    internalDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Internal description cannot exceed 500 characters"],
    },
    displayDescription: {
      type: String,
      trim: true,
      maxlength: [100, "Display description cannot exceed 100 characters"],
    },
    scope: {
      type: String,
      enum: ["Global", "Branch"],
      required: [true, "Scope is required"],
    },
    canteen_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Canteen",
      },
    ],
    applyTo: {
      type: String,
      enum: ["All items", "Category", "Specific items", "Combo only"],
      required: [true, "Apply to is required"],
    },
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductCategory",
      },
    ],
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed Amount"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    maxDiscountCap: {
      type: Number,
      min: [0, "Maximum discount cap cannot be negative"],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    minItemQuantity: {
      type: Number,
      default: 0,
      min: [0, "Minimum item quantity cannot be negative"],
    },
    timeRestriction: {
      fromTime: { type: String }, // Format HH:mm
      toTime: { type: String }, // Format HH:mm
    },
    startDatetime: {
      type: Date,
      required: [true, "Start datetime is required"],
    },
    endDatetime: {
      type: Date,
      required: [true, "End datetime is required"],
    },
    totalLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usagePerUser: {
      type: Number,
      default: 1,
      min: [1, "Usage per user must be at least 1"],
    },
    allowStackWithCombo: {
      type: Boolean,
      default: false,
    },
    state: {
      type: String,
      enum: [
        "Draft",
        "Upcoming",
        "Active",
        "Inactive",
        "Expired",
        "OutOfQuota",
        "Archived",
      ],
      default: "Draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changeLog: [voucherChangeLogSchema],
  },
  {
    timestamps: true,
  },
);

voucherSchema.index({ code: 1 });
voucherSchema.index({ startDatetime: 1, endDatetime: 1 });
voucherSchema.index({ state: 1 });

// Check if voucher is valid (Used by old methods; updated conceptually but relies on Validator pattern in service now)
voucherSchema.methods.isValid = function () {
  const now = new Date();
  if (this.state !== "Active") return false;
  if (now < this.startDatetime || now > this.endDatetime) return false;
  if (this.totalLimit !== null && this.usedCount >= this.totalLimit)
    return false;
  return true;
};

// Calculate discount (Migrated to use current fields)
voucherSchema.methods.calculateDiscount = function (orderAmount) {
  if (!this.isValid()) return 0;
  if (orderAmount < this.minOrderValue) return 0;

  let discount = 0;
  if (this.discountType === "Percentage") {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountCap) {
      discount = Math.min(discount, this.maxDiscountCap);
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, orderAmount);
};

export const Voucher = mongoose.model("Voucher", voucherSchema);
