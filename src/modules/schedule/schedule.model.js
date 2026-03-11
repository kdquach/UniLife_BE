import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
      index: true,
    },
    weekStart: {
      type: Date,
      required: [true, "Week start is required"],
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: [1, "Version must be at least 1"],
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true,
      default: "draft",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

scheduleSchema.index({ canteenId: 1, weekStart: 1, version: -1 });
scheduleSchema.index({ canteenId: 1, weekStart: 1, status: 1 });
// Chỉ cho phép tối đa một lịch published cho mỗi canteen trong cùng tuần.
scheduleSchema.index(
  { canteenId: 1, weekStart: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "published",
    },
  },
);

export const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);
