import mongoose from "mongoose";

// User Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: ["order", "promotion", "system", "feedback", "shift", "salary"],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [1000, "Content cannot exceed 1000 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For storing additional data like orderId, etc.
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// System Notification Schema (for all users or specific groups)
const systemNotificationSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [2000, "Content cannot exceed 2000 characters"],
    },
    targetRole: {
      type: String,
      enum: ["all", "admin", "manager", "staff", "customer"],
      default: "all",
    },
    activeFrom: {
      type: Date,
      default: Date.now,
    },
    activeTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

systemNotificationSchema.index({ isActive: 1, activeFrom: 1, activeTo: 1 });
systemNotificationSchema.index({ targetRole: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
export const SystemNotification = mongoose.model(
  "SystemNotification",
  systemNotificationSchema,
);
