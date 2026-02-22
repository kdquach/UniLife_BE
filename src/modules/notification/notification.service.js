import mongoose from "mongoose";
import { Notification, SystemNotification } from "./notification.model.js";
import { SystemNotificationRead } from "./systemNotificationRead.model.js";
import AppError from "../../utils/AppError.js";

const toObjectIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.toString) return value.toString();
  return null;
};

const withCanteenScope = (filter = {}, canteenId = null) => {
  if (!canteenId) return filter;
  return {
    ...filter,
    $or: [{ canteenId }, { canteenId: null }],
  };
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed?.createdAt || !parsed?._id) return null;
    return {
      createdAt: new Date(parsed.createdAt),
      _id: new mongoose.Types.ObjectId(parsed._id),
    };
  } catch {
    return null;
  }
};

const encodeCursor = (createdAt, id) => {
  if (!createdAt || !id) return null;
  return Buffer.from(
    JSON.stringify({
      createdAt: new Date(createdAt).toISOString(),
      _id: toObjectIdString(id),
    }),
  ).toString("base64");
};

const buildCursorFilter = (cursor) => {
  if (!cursor?.createdAt || !cursor?._id) return {};
  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        _id: { $lt: cursor._id },
      },
    ],
  };
};

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
  const filter = withCanteenScope({ userId }, query.canteenId);
  if (query.isRead !== undefined) filter.isRead = query.isRead;
  if (query.type) filter.type = query.type;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit || 50);
  return notifications;
};

export const getMyNotifications = async (userId, query = {}, canteenId = null) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const cursor = decodeCursor(query.cursor);
  const filter = withCanteenScope(
    {
      userId,
      ...buildCursorFilter(cursor),
    },
    canteenId,
  );

  if (query.type) {
    filter.type = query.type;
  }
  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === "true" || query.isRead === true;
  }

  const rows = await Notification.find(filter)
    .select("_id canteenId userId type title content isRead metadata createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasNextPage = rows.length > limit;
  const data = hasNextPage ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  const nextCursor = hasNextPage ? encodeCursor(last?.createdAt, last?._id) : null;

  return {
    data,
    pagination: {
      hasNextPage,
      nextCursor,
      limit,
    },
  };
};

export const getUnreadCount = async (userId, canteenId = null, role = "customer") => {
  const personalUnread = await Notification.countDocuments(
    withCanteenScope({ userId, isRead: false }, canteenId),
  );

  const now = new Date();
  const systemFilter = {
    isActive: true,
    activeFrom: { $lte: now },
    $or: [{ activeTo: null }, { activeTo: { $gte: now } }],
    targetRole: { $in: ["all", role] },
  };

  if (canteenId) {
    systemFilter.$and = [{ $or: [{ canteenId }, { canteenId: null }] }];
  }

  const activeSystemIds = await SystemNotification.find(systemFilter).distinct("_id");
  if (!activeSystemIds.length) return personalUnread;

  const readSystemCount = await SystemNotificationRead.countDocuments({
    userId,
    systemNotificationId: { $in: activeSystemIds },
  });

  const systemUnread = Math.max(activeSystemIds.length - readSystemCount, 0);
  return personalUnread + systemUnread;
};

export const markAsRead = async (notificationId, userId, canteenId = null) => {
  const filter = withCanteenScope({ _id: notificationId, userId }, canteenId);
  const existing = await Notification.findOne(filter);
  if (!existing) {
    throw new AppError("Notification not found", 404);
  }

  if (existing.isRead) {
    return existing;
  }

  const notification = await Notification.findOneAndUpdate(
    filter,
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  return notification;
};

export const markAllAsRead = async (userId, canteenId = null) => {
  await Notification.updateMany(
    withCanteenScope({ userId, isRead: false }, canteenId),
    { isRead: true, readAt: new Date() },
  );
};

export const deleteNotification = async (notificationId, userId, canteenId = null) => {
  const notification = await Notification.findOneAndDelete(withCanteenScope({
    _id: notificationId,
    userId,
  }, canteenId));
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
};

export const deleteAllNotifications = async (userId, canteenId = null) => {
  await Notification.deleteMany(withCanteenScope({ userId }, canteenId));
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

export const getNotificationFeed = async (context = {}, query = {}) => {
  const { userId, role, canteenId } = context;
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const cursor = decodeCursor(query.cursor);
  const cursorFilter = buildCursorFilter(cursor);

  const personalFilter = withCanteenScope(
    {
      userId,
      ...cursorFilter,
    },
    canteenId,
  );
  if (query.type) {
    personalFilter.type = query.type;
  }

  const now = new Date();
  const systemFilter = {
    isActive: true,
    activeFrom: { $lte: now },
    $or: [{ activeTo: null }, { activeTo: { $gte: now } }],
    targetRole: { $in: ["all", role] },
    ...cursorFilter,
  };
  if (canteenId) {
    systemFilter.$and = [{ $or: [{ canteenId }, { canteenId: null }] }];
  }

  const [personalRows, systemRows] = await Promise.all([
    Notification.find(personalFilter)
      .select("_id canteenId type title content isRead metadata createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean(),
    SystemNotification.find(systemFilter)
      .select("_id canteenId title content createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean(),
  ]);

  const systemIds = systemRows.map((item) => item._id);
  const readRows = await SystemNotificationRead.find({
    userId,
    systemNotificationId: { $in: systemIds },
  })
    .select("systemNotificationId")
    .lean();

  const readSet = new Set(
    readRows.map((item) => toObjectIdString(item.systemNotificationId)).filter(Boolean),
  );

  const normalizedPersonal = personalRows.map((item) => ({
    _id: item._id,
    source: "personal",
    canteenId: item.canteenId || null,
    type: item.type,
    title: item.title,
    content: item.content,
    isRead: item.isRead,
    metadata: item.metadata || null,
    createdAt: item.createdAt,
  }));

  const normalizedSystem = systemRows.map((item) => ({
    _id: item._id,
    source: "system",
    canteenId: item.canteenId || null,
    type: "system",
    title: item.title,
    content: item.content,
    isRead: readSet.has(toObjectIdString(item._id)),
    metadata: null,
    createdAt: item.createdAt,
  }));

  const merged = [...normalizedPersonal, ...normalizedSystem].sort((a, b) => {
    const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return toObjectIdString(b._id).localeCompare(toObjectIdString(a._id));
  });

  const hasNextPage = merged.length > limit;
  const data = hasNextPage ? merged.slice(0, limit) : merged;
  const last = data[data.length - 1];
  const nextCursor = hasNextPage ? encodeCursor(last?.createdAt, last?._id) : null;

  return {
    data,
    pagination: {
      hasNextPage,
      nextCursor,
      limit,
    },
  };
};

export const getAllSystemNotifications = async (query = {}) => {
  const filter = withCanteenScope({}, query.canteenId);
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.targetRole) filter.targetRole = query.targetRole;

  const notifications = await SystemNotification.find(filter)
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });
  return notifications;
};

export const getSystemNotificationById = async (id, canteenId = null) => {
  const notification = await SystemNotification.findOne(
    withCanteenScope({ _id: id }, canteenId),
  ).populate(
    "createdBy",
    "fullName",
  );
  if (!notification) {
    throw new AppError("System notification not found", 404);
  }
  return notification;
};

export const updateSystemNotification = async (id, updateData, canteenId = null) => {
  const notification = await SystemNotification.findOneAndUpdate(
    withCanteenScope({ _id: id }, canteenId),
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

export const deleteSystemNotification = async (id, canteenId = null) => {
  const notification = await SystemNotification.findOneAndDelete(
    withCanteenScope({ _id: id }, canteenId),
  );
  if (!notification) {
    throw new AppError("System notification not found", 404);
  }
};
