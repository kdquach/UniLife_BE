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

// Admin routes
router.use(restrictTo("admin"));

router.get("/system", notificationController.getAllSystemNotifications);
router.post("/system", notificationController.createSystemNotification);
router.post("/send-bulk", notificationController.sendNotificationToUsers);

router
  .route("/system/:id")
  .get(notificationController.getSystemNotificationById)
  .patch(notificationController.updateSystemNotification)
  .delete(notificationController.deleteSystemNotification);

export default router;
