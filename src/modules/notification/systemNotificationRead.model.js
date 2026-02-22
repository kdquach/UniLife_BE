import mongoose from "mongoose";

const systemNotificationReadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    systemNotificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SystemNotification",
      required: [true, "System notification ID is required"],
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      default: null,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

systemNotificationReadSchema.index(
  { userId: 1, systemNotificationId: 1 },
  { unique: true },
);
systemNotificationReadSchema.index({ userId: 1, createdAt: -1 });
systemNotificationReadSchema.index({ canteenId: 1, userId: 1 });

export const SystemNotificationRead =
  mongoose.models.SystemNotificationRead ||
  mongoose.model("SystemNotificationRead", systemNotificationReadSchema);
