import mongoose from "mongoose";
import { Notification, SystemNotification } from "./notification.model.js";
import { SystemNotificationRead } from "./systemNotificationRead.model.js";
import AppError from "../../utils/AppError.js";

const NOTIFICATION_TYPES = {
  dashboard: ["order", "promotion", "system", "feedback", "shift", "salary"],
  client: ["order", "promotion", "system", "feedback"],
};

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

const resolveAllowedTypesByRole = (role = "customer") => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin" || normalized === "staff" || normalized === "manager") {
    return NOTIFICATION_TYPES.dashboard;
  }
  return NOTIFICATION_TYPES.client;
};

const shouldScopePersonalByCanteen = (role = "customer") => {
  const normalized = String(role || "").toLowerCase();
  return ["admin", "staff", "manager"].includes(normalized);
};

const withPersonalScope = (filter = {}, canteenId = null, role = "customer") => {
  if (!shouldScopePersonalByCanteen(role)) {
    return filter;
  }
  return withCanteenScope(filter, canteenId);
};

const parseIsRead = (value) => {
  if (value === undefined) return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new AppError("Invalid isRead value. Expected true or false", 400);
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

const buildActiveSystemFilter = (role, canteenId = null, extraFilter = {}) => {
  const now = new Date();
  const filter = {
    isActive: true,
    activeFrom: { $lte: now },
    $or: [{ activeTo: null }, { activeTo: { $gte: now } }],
    targetRole: { $in: ["all", role] },
    ...extraFilter,
  };

  if (canteenId) {
    filter.$and = [{ $or: [{ canteenId }, { canteenId: null }] }];
  }

  return filter;
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

export const getMyNotifications = async (
  userId,
  query = {},
  canteenId = null,
  role = "customer",
) => {
  const { type, isRead } = query;
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const allowedTypes = resolveAllowedTypesByRole(role);

  if (type && !allowedTypes.includes(type)) {
    throw new AppError("Invalid notification type for current role", 400);
  }

  const parsedIsRead = parseIsRead(isRead);

  const baseFilter = {
    userId,
    ...(type && { type }),
    ...(parsedIsRead !== undefined && { isRead: parsedIsRead }),
  };

  const filter = withPersonalScope(baseFilter, canteenId, role);

  const rows = await Notification.find(filter)
    .select("_id canteenId userId type title content isRead metadata createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return rows;
};

export const getUnreadCount = async (userId, canteenId = null, role = "customer") => {
  const personalUnread = await Notification.countDocuments(
    withPersonalScope({ userId, isRead: false }, canteenId, role),
  );

  const systemFilter = buildActiveSystemFilter(role, canteenId);

  const activeSystemIds = await SystemNotification.find(systemFilter).distinct("_id");
  if (!activeSystemIds.length) return personalUnread;

  const readSystemCount = await SystemNotificationRead.countDocuments({
    userId,
    systemNotificationId: { $in: activeSystemIds },
  });

  const systemUnread = Math.max(activeSystemIds.length - readSystemCount, 0);
  return personalUnread + systemUnread;
};

export const markAsRead = async (
  notificationId,
  userId,
  canteenId = null,
  role = "customer",
) => {
  const filter = withPersonalScope({ _id: notificationId, userId }, canteenId, role);
  const existing = await Notification.findOne(filter);
  if (existing) {
    if (existing.isRead) {
      return existing;
    }

    return Notification.findOneAndUpdate(
      filter,
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  }

  const systemFilter = withCanteenScope({ _id: notificationId }, canteenId);
  const systemNotification = await SystemNotification.findOne(systemFilter).lean();
  if (!systemNotification) {
    throw new AppError("Notification not found", 404);
  }

  await SystemNotificationRead.updateOne(
    {
      userId,
      systemNotificationId: systemNotification._id,
    },
    {
      $set: {
        canteenId: canteenId || null,
        readAt: new Date(),
      },
    },
    { upsert: true },
  );

  return {
    _id: systemNotification._id,
    type: "system",
    title: systemNotification.title,
    content: systemNotification.content,
    isRead: true,
    metadata: null,
    createdAt: systemNotification.createdAt,
  };
};

export const markAllAsRead = async (userId, canteenId = null, role = "customer") => {
  await Notification.updateMany(
    withPersonalScope({ userId, isRead: false }, canteenId, role),
    { isRead: true, readAt: new Date() },
  );

  const systemFilter = buildActiveSystemFilter(role, canteenId);

  const activeSystemIds = await SystemNotification.find(systemFilter)
    .select("_id")
    .lean();

  if (!activeSystemIds.length) {
    return;
  }

  const readAt = new Date();
  await SystemNotificationRead.bulkWrite(
    activeSystemIds.map((item) => ({
      updateOne: {
        filter: {
          userId,
          systemNotificationId: item._id,
        },
        update: {
          $set: {
            canteenId: canteenId || null,
            readAt,
          },
        },
        upsert: true,
      },
    })),
  );
};

export const deleteNotification = async (
  notificationId,
  userId,
  canteenId = null,
  role = "customer",
) => {
  const notification = await Notification.findOneAndDelete(withPersonalScope({
    _id: notificationId,
    userId,
  }, canteenId, role));
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
};

export const deleteAllNotifications = async (userId, canteenId = null, role = "customer") => {
  await Notification.deleteMany(withPersonalScope({ userId }, canteenId, role));
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
  const filter = buildActiveSystemFilter(role, canteenId);

  const notifications = await SystemNotification.find(filter).sort({
    createdAt: -1,
  });
  return notifications;
};

export const getNotificationFeed = async (context = {}, query = {}) => {
  const { userId, role, canteenId } = context;
  const { type, isRead } = query;
  const allowedTypes = resolveAllowedTypesByRole(role);

  if (type && !allowedTypes.includes(type)) {
    throw new AppError("Invalid notification type for current role", 400);
  }

  const parsedIsRead = parseIsRead(isRead);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  const cursor = decodeCursor(query.cursor);
  const cursorFilter = buildCursorFilter(cursor);
  const personalFilter = withPersonalScope(
    {
      userId,
      ...cursorFilter,
    },
    canteenId,
    role,
  );
  if (type) {
    personalFilter.type = type;
  }
  if (parsedIsRead !== undefined) {
    personalFilter.isRead = parsedIsRead;
  }

  const includeSystemNotifications = !type || type === "system";
  const systemFilter = includeSystemNotifications
    ? buildActiveSystemFilter(role, canteenId, cursorFilter)
    : null;

  const [personalRows, systemRows] = await Promise.all([
    Notification.find(personalFilter)
      .select("_id canteenId type title content isRead metadata createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean(),
    includeSystemNotifications
      ? SystemNotification.find(systemFilter)
        .select("_id canteenId title content createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean()
      : Promise.resolve([]),
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

  const normalizedSystemBase = systemRows.map((item) => ({
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

  const normalizedSystem = parsedIsRead === undefined
    ? normalizedSystemBase
    : normalizedSystemBase.filter((item) => item.isRead === parsedIsRead);

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
