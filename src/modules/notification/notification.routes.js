import express from "express";
import * as notificationController from "./notification.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User notification routes
router.get("/feed", notificationController.getNotificationFeed);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);
router.delete("/delete-all", notificationController.deleteAllNotifications);

// System notification routes (public for users)
router.get(
  "/system/active",
  notificationController.getActiveSystemNotifications,
);

// Admin/Manager routes
router.get(
  "/system",
  restrictTo("admin", "manager"),
  notificationController.getAllSystemNotifications,
);
router.post(
  "/system",
  restrictTo("admin", "manager"),
  notificationController.createSystemNotification,
);
router.post(
  "/send-bulk",
  restrictTo("admin", "manager"),
  restrictTo("admin"),
  notificationController.sendNotificationToUsers,
);

router
  .route("/system/:id")
  .get(
    restrictTo("admin", "manager"),
    notificationController.getSystemNotificationById,
  )
  .patch(
    restrictTo("admin", "manager"),
    notificationController.updateSystemNotification,
  )
  .delete(
    restrictTo("admin", "manager"),
    notificationController.deleteSystemNotification,
  );

// Keep dynamic :id route last to avoid shadowing static paths like /system
router.get("/:id", notificationController.getNotificationById);

export default router;
