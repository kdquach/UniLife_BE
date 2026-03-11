import mongoose from "mongoose";

const staffShiftSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      index: true,
      default: null,
    },
    // Tương thích dữ liệu/index cũ theo scheduleVersion.
    scheduleVersion: {
      type: Number,
      default: null,
      index: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: [true, "Shift ID is required"],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Staff ID is required"],
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    status: {
      type: String,
      enum: [
        "draft",
        "assigned",
        "scheduled",
        "checked_in",
        "checked_out",
        "absent",
        "cancelled",
      ],
      default: "assigned",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    actualWorkHours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attendanceStatus: {
      type: String,
      enum: [
        "on_time",
        "late",
        "early",
        "critical_late",
        "early_leave",
        "missing_checkout",
        "overtime",
      ],
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    actualWorkMinutes: {
      type: Number,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    overtimeApproved: {
      type: Boolean,
      default: false,
    },
    checkInIp: {
      type: String,
      trim: true,
    },
    checkInDevice: {
      type: String,
      trim: true,
    },
    checkOutIp: {
      type: String,
      trim: true,
    },
    checkOutDevice: {
      type: String,
      trim: true,
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    managerNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Manager note cannot exceed 1000 characters"],
    },
    earlyLeaveReason: {
      type: String,
      trim: true,
      maxlength: [500, "Early leave reason cannot exceed 500 characters"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

staffShiftSchema.index({ shiftId: 1, date: 1 });
staffShiftSchema.index({ staffId: 1, date: 1 });
staffShiftSchema.index({ canteenId: 1, date: 1 });
staffShiftSchema.index({ scheduleId: 1, date: 1 });
staffShiftSchema.index({ scheduleVersion: 1 });
staffShiftSchema.index({ status: 1 });
staffShiftSchema.index({ attendanceStatus: 1 });
staffShiftSchema.index({ needsReview: 1 });
staffShiftSchema.index(
  { scheduleId: 1, shiftId: 1, staffId: 1, date: 1 },
  { unique: true, sparse: true },
);

export const StaffShift =
  mongoose.models.StaffShift || mongoose.model("StaffShift", staffShiftSchema);
