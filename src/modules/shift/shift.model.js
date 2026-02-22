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
    durationMinutes: {
      type: Number,
      default: 240,
      min: [0, "Duration must be positive"],
    },
    gracePeriodBefore: {
      type: Number, // minutes before shift start allowed to check-in
      default: 15,
    },
    gracePeriodAfter: {
      type: Number, // minutes after shift start still allowed to check-in
      default: 30,
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

// Indexes
shiftSchema.index({ canteenId: 1 });
shiftSchema.index({ status: 1 });

export const Shift =
  mongoose.models.Shift || mongoose.model("Shift", shiftSchema);

// Re-export StaffShift from its dedicated file for backward compatibility
export { StaffShift } from "./staffShift.model.js";
