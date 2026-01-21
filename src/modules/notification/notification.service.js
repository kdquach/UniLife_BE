import { Notification, SystemNotification } from "./notification.model.js";
import AppError from "../../utils/AppError.js";

// ============ User Notification Services ============

export const createNotification = async (notificationData) => {
  const notification = await Notification.create(notificationData);
  return notification;
};

export const createBulkNotifications = async (userIds, notificationData) => {
  const notifications = userIds.map((userId) => ({
    ...notificationData,
    userId,
  }));
  const result = await Notification.insertMany(notifications);
  return result;
};

export const getNotificationsByUser = async (userId, query = {}) => {
  const filter = { userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead;
  if (query.type) filter.type = query.type;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit || 50);
  return notifications;
};

export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ userId, isRead: false });
  return count;
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
};

export const deleteAllNotifications = async (userId) => {
  await Notification.deleteMany({ userId });
};

// ============ System Notification Services ============

export const createSystemNotification = async (notificationData, createdBy) => {
  const notification = await SystemNotification.create({
    ...notificationData,
    createdBy,
  });
  return notification;
};

export const getActiveSystemNotifications = async (role, canteenId = null) => {
  const now = new Date();
  const filter = {
    isActive: true,
    activeFrom: { $lte: now },
    $or: [{ activeTo: null }, { activeTo: { $gte: now } }],
    targetRole: { $in: ["all", role] },
  };

  if (canteenId) {
    filter.$and = [{ $or: [{ canteenId }, { canteenId: null }] }];
  }

  const notifications = await SystemNotification.find(filter).sort({
    createdAt: -1,
  });
  return notifications;
};

export const getAllSystemNotifications = async (query = {}) => {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.targetRole) filter.targetRole = query.targetRole;

  const notifications = await SystemNotification.find(filter)
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });
  return notifications;
};

export const getSystemNotificationById = async (id) => {
  const notification = await SystemNotification.findById(id).populate(
    "createdBy",
    "fullName",
  );
  if (!notification) {
    throw new AppError("System notification not found", 404);
  }
  return notification;
};

export const updateSystemNotification = async (id, updateData) => {
  const notification = await SystemNotification.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!notification) {
    throw new AppError("System notification not found", 404);
  }
  return notification;
};

export const deleteSystemNotification = async (id) => {
  const notification = await SystemNotification.findByIdAndDelete(id);
  if (!notification) {
    throw new AppError("System notification not found", 404);
  }
};
