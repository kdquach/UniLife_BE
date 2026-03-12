import mongoose from "mongoose";

const shiftChangeRequestSchema = new mongoose.Schema(
  {
    staffShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffShift",
      required: [true, "Staff shift ID is required"],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Staff ID is required"],
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      default: null,
    },
    type: {
      type: String,
      enum: ["swap", "drop", "replace"],
      default: "drop",
      required: [true, "Type is required"],
    },
    targetStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requestedShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
      required: [true, "Reason is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

shiftChangeRequestSchema.index({ staffShiftId: 1, status: 1 });
shiftChangeRequestSchema.index({ staffId: 1, createdAt: -1 });
shiftChangeRequestSchema.index({ canteenId: 1, status: 1, createdAt: -1 });
shiftChangeRequestSchema.index({ targetStaffId: 1, createdAt: -1 });
shiftChangeRequestSchema.index({ status: 1, createdAt: -1 });

export const ShiftChangeRequest =
  mongoose.models.ShiftChangeRequest
  || mongoose.model("ShiftChangeRequest", shiftChangeRequestSchema);
