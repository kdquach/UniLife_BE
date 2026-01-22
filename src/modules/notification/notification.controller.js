import catchAsync from "../../utils/catchAsync.js";
import * as notificationService from "./notification.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Notification, SystemNotification } from "./notification.model.js";

// ============ User Notification Controllers ============

export const getMyNotifications = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Notification, req.query, {
    ...filterPresets.notification,
    baseFilter: { userId: req.user._id },
    populate: [{ path: "canteenId", select: "name" }],
  });
  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy thông báo thành công"));
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json({ status: "success", data: { unreadCount: count } });
});

export const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id,
  );
  res.status(200).json({ status: "success", data: { notification } });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res
    .status(200)
    .json({ status: "success", message: "All notifications marked as read" });
});

export const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  res.status(204).json({ status: "success", data: null });
});

export const deleteAllNotifications = catchAsync(async (req, res) => {
  await notificationService.deleteAllNotifications(req.user._id);
  res.status(204).json({ status: "success", data: null });
});

// ============ System Notification Controllers ============

export const createSystemNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.createSystemNotification(
    req.body,
    req.user._id,
  );
  res.status(201).json({ status: "success", data: { notification } });
});

export const getActiveSystemNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.getActiveSystemNotifications(
    req.user.role,
    req.query.canteenId,
  );
  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: { notifications },
  });
});

export const getAllSystemNotifications = catchAsync(async (req, res) => {
  const result = await paginatedQuery(SystemNotification, req.query, {
    allowedFilters: ["targetRole", "isActive", "canteenId"],
    searchFields: ["title", "content"],
    allowedSortFields: ["createdAt", "activeFrom", "activeTo"],
    populate: [
      { path: "canteenId", select: "name" },
      { path: "createdBy", select: "fullName" },
    ],
  });
  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy thông báo hệ thống thành công"));
});

export const getSystemNotificationById = catchAsync(async (req, res) => {
  const notification = await notificationService.getSystemNotificationById(
    req.params.id,
  );
  res.status(200).json({ status: "success", data: { notification } });
});

export const updateSystemNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.updateSystemNotification(
    req.params.id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { notification } });
});

export const deleteSystemNotification = catchAsync(async (req, res) => {
  await notificationService.deleteSystemNotification(req.params.id);
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
