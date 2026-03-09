import mongoose from "mongoose";

const draftShiftAssignmentSchema = new mongoose.Schema(
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
    weekStart: {
      type: Date,
      required: [true, "Week start is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: true,
  },
);

draftShiftAssignmentSchema.index({ canteenId: 1, weekStart: 1 });
draftShiftAssignmentSchema.index({ shiftId: 1, staffId: 1, date: 1, canteenId: 1 }, { unique: true });
draftShiftAssignmentSchema.index({ canteenId: 1, date: 1 });

export const DraftShiftAssignment = mongoose.models.DraftShiftAssignment
  || mongoose.model("DraftShiftAssignment", draftShiftAssignmentSchema);
