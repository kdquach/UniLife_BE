import catchAsync from "../../utils/catchAsync.js";
import * as notificationService from "./notification.service.js";
import { formatPaginatedResponse } from "../../utils/queryHelper.js";

// ============ User Notification Controllers ============

const buildFeedContext = (req) => ({
  userId: req.user._id,
  role: req.user.role,
  canteenId: (() => {
    const role = String(req.user?.role || "").toLowerCase();
    const staffScopedRoles = ["admin", "manager", "staff", "canteen_owner"];
    if (staffScopedRoles.includes(role)) {
      return req.user.canteenId || null;
    }

    return req.query.canteenId || req.user.canteenId || null;
  })(),
});

export const getNotificationFeed = catchAsync(async (req, res) => {
  const result = await notificationService.getNotificationFeed(
    buildFeedContext(req),
    req.query,
  );

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
    message: "Lấy notification feed thành công",
  });
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const context = buildFeedContext(req);
  const count = await notificationService.getUnreadCount(
    req.user._id,
    context.canteenId,
    context.role,
  );
  res.status(200).json({ status: "success", data: { unreadCount: count } });
});

export const getNotificationById = catchAsync(async (req, res) => {
  const context = buildFeedContext(req);
  const notification = await notificationService.getNotificationById(
    req.params.id,
    req.user._id,
    context.canteenId,
    context.role,
  );

  res.status(200).json({
    status: "success",
    data: { notification },
  });
});

export const markAsRead = catchAsync(async (req, res) => {
  const context = buildFeedContext(req);
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id,
    context.canteenId,
    context.role,
  );
  res.status(200).json({ status: "success", data: { notification } });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  const context = buildFeedContext(req);
  await notificationService.markAllAsRead(
    req.user._id,
    context.canteenId,
    context.role,
  );
  res
    .status(200)
    .json({ status: "success", message: "All notifications marked as read" });
});

export const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(
    req.params.id,
    req.user._id,
    req.user.canteenId,
    req.user.role,
  );
  res.status(204).json({ status: "success", data: null });
});

export const deleteAllNotifications = catchAsync(async (req, res) => {
  await notificationService.deleteAllNotifications(
    req.user._id,
    req.user.canteenId,
    req.user.role,
  );
  res.status(204).json({ status: "success", data: null });
});

// ============ System Notification Controllers ============

export const createSystemNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.createSystemNotification(
    req.body,
    req.user,
  );
  res.status(201).json({ status: "success", data: { notification } });
});

export const getActiveSystemNotifications = catchAsync(async (req, res) => {
  const canteenScope = req.user.role === "admin"
    ? req.query.canteenId || null
    : req.user.canteenId || null;

  const notifications = await notificationService.getActiveSystemNotifications(
    req.user.role,
    canteenScope,
  );
  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: { notifications },
  });
});

export const getAllSystemNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.getAllSystemNotifications(
    req.query,
    req.user,
  );
  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy thông báo hệ thống thành công"));
});

export const getSystemNotificationById = catchAsync(async (req, res) => {
  const notification = await notificationService.getSystemNotificationById(
    req.params.id,
    req.user,
  );
  res.status(200).json({ status: "success", data: { notification } });
});

export const updateSystemNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.updateSystemNotification(
    req.params.id,
    req.body,
    req.user,
  );
  res.status(200).json({ status: "success", data: { notification } });
});

export const deleteSystemNotification = catchAsync(async (req, res) => {
  await notificationService.deleteSystemNotification(
    req.params.id,
    req.user,
  );
  res.status(204).json({ status: "success", data: null });
});

export const sendNotificationToUsers = catchAsync(async (req, res) => {
  const { userIds, ...notificationData } = req.body;
  const notifications = await notificationService.createBulkNotifications(
    userIds,
    notificationData,
  );
  res.status(201).json({
    status: "success",
    results: notifications.length,
    data: { notifications },
  });
});
