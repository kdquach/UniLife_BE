import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    name: {
      type: String,
      required: [true, "Shift name is required"],
      trim: true,
      maxlength: [100, "Shift name cannot exceed 100 characters"],
    },
    startTime: {
      type: String, // Format: "HH:mm"
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String, // Format: "HH:mm"
      required: [true, "End time is required"],
    },
    dayOfWeek: {
      type: [Number], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      default: [1, 2, 3, 4, 5], // Monday to Friday by default
      validate: {
        validator: function (arr) {
          return arr.every((day) => day >= 0 && day <= 6);
        },
        message: "Day of week must be between 0 (Sunday) and 6 (Saturday)",
      },
    },
    maxStaff: {
      type: Number,
      default: 5,
      min: [1, "Max staff must be at least 1"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
shiftSchema.index({ canteenId: 1 });
shiftSchema.index({ status: 1 });

// Staff Assignment Schema - for assigning staff to specific shifts on specific dates
const staffShiftSchema = new mongoose.Schema(
  {
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
      enum: ["scheduled", "checked_in", "checked_out", "absent", "cancelled"],
      default: "scheduled",
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
  },
  {
    timestamps: true,
  },
);

staffShiftSchema.index({ shiftId: 1, date: 1 });
staffShiftSchema.index({ staffId: 1, date: 1 });
staffShiftSchema.index({ canteenId: 1, date: 1 });
staffShiftSchema.index({ status: 1 });

// Calculate actual work hours when checking out
staffShiftSchema.methods.calculateWorkHours = function () {
  if (this.checkInTime && this.checkOutTime) {
    this.actualWorkHours =
      (this.checkOutTime - this.checkInTime) / (1000 * 60 * 60);
  }
  return this.actualWorkHours;
};

export const Shift = mongoose.model("Shift", shiftSchema);
export const StaffShift = mongoose.model("StaffShift", staffShiftSchema);
