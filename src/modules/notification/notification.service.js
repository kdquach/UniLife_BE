import mongoose from "mongoose";
import { Notification, SystemNotification } from "./notification.model.js";
import { SystemNotificationRead } from "./systemNotificationRead.model.js";
import AppError from "../../utils/AppError.js";
import { paginatedQuery } from "../../utils/queryHelper.js";
import { notifyCanteen, notifyGlobal, notifyRemoveNotifications } from "../../websocket/notify.js";
import Order from "../order/order.model.js";
import { dispatchSystemNotification } from "./notification.dispatcher.js";

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

const normalizeRole = (value = "") => String(value || "").toLowerCase();

const isAdminRole = (role = "") => normalizeRole(role) === "admin";

const isManagerRole = (role = "") => {
  const normalized = normalizeRole(role);
  return normalized === "manager" || normalized === "canteen_owner";
};

const normalizeSystemRoleForFilter = (role = "") => {
  const normalized = normalizeRole(role);
  if (normalized === "canteen_owner") return "manager";
  return normalized || "customer";
};

const hasRolePermissionForSystemNotification = (targetRole = "", role = "") => {
  const actorRole = normalizeRole(role);
  const normalizedTargetRole = String(targetRole || "all").toLowerCase();

  if (isAdminRole(actorRole)) {
    return true;
  }

  if (!isManagerRole(actorRole)) {
    return false;
  }

  // Manager không thể gửi thông báo tới admin hoặc manager khác.
  return !["admin", "manager"].includes(normalizedTargetRole);
};

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const assertSystemNotificationAccess = (actor) => {
  const role = normalizeRole(actor?.role);
  if (!isAdminRole(role) && !isManagerRole(role)) {
    throw new AppError("Bạn không có quyền quản lý thông báo hệ thống", 403);
  }

  if (isManagerRole(role) && !actor?.canteenId) {
    throw new AppError("Bạn chưa được phân quyền căng tin", 403);
  }
};

const buildSystemReadableScope = (actor) => {
  const role = normalizeRole(actor?.role);

  if (isAdminRole(role)) {
    return {};
  }

  const canteenId = actor?.canteenId;
  return {
    $or: [{ canteenId }, { canteenId: null }],
  };
};

const buildSystemWritableScope = (actor) => {
  const role = normalizeRole(actor?.role);

  if (isAdminRole(role)) {
    return {};
  }

  return {
    canteenId: actor?.canteenId,
  };
};

const buildActiveRangeFilter = (now = new Date()) => ({
  activeFrom: { $lte: now },
  $or: [{ activeTo: null }, { activeTo: { $gte: now } }],
});

const buildSystemLifecycleFilter = (lifecycle = "") => {
  const normalized = String(lifecycle || "").trim().toLowerCase();
  if (!normalized) return {};

  const now = new Date();

  if (normalized === "active") {
    return {
      isActive: true,
      ...buildActiveRangeFilter(now),
    };
  }

  if (normalized === "expired") {
    return {
      activeTo: { $lt: now },
    };
  }

  if (normalized === "inactive") {
    return {
      isActive: false,
    };
  }

  throw new AppError("Giá trị lifecycle không hợp lệ", 400);
};

const mergeAndFilters = (...filters) => {
  const validFilters = filters.filter(
    (item) => item && Object.keys(item).length > 0,
  );

  if (validFilters.length === 0) return {};
  if (validFilters.length === 1) return validFilters[0];
  return { $and: validFilters };
};

const buildNotDeletedFilter = () => ({
  isDeleted: { $ne: true },
});

const removeUndefinedFields = (payload = {}) => Object.fromEntries(
  Object.entries(payload).filter(([, value]) => value !== undefined),
);

const normalizeSystemNotificationPayload = (payload = {}, actor = null) => {
  const role = normalizeRole(actor?.role);
  const normalized = {
    title: hasValue(payload.title) ? String(payload.title).trim() : undefined,
    content: hasValue(payload.content)
      ? String(payload.content).trim()
      : hasValue(payload.body)
        ? String(payload.body).trim()
        : undefined,
    targetRole: hasValue(payload.targetRole) ? payload.targetRole : undefined,
    isActive: payload.isActive,
  };

  if (isAdminRole(role)) {
    normalized.canteenId = hasValue(payload.canteenId) ? payload.canteenId : null;
  }

  if (isManagerRole(role)) {
    normalized.canteenId = actor?.canteenId;
  }

  if (
    hasValue(normalized.targetRole)
    && !hasRolePermissionForSystemNotification(normalized.targetRole, role)
  ) {
    throw new AppError("Manager không thể gửi thông báo tới vai trò này", 400);
  }

  return normalized;
};

const emitRealtimeSystemNotification = (notificationDoc) => {
  if (!notificationDoc || notificationDoc.isActive === false) {
    return;
  }

  const eventPayload = {
    id: notificationDoc._id,
    type: "system",
    title: notificationDoc.title,
    content: notificationDoc.content,
    createdAt: notificationDoc.createdAt,
    meta: {
      source: "system_notification",
      targetRole: notificationDoc.targetRole,
      canteenId: notificationDoc.canteenId || null,
    },
  };

  if (notificationDoc.canteenId) {
    notifyCanteen(toObjectIdString(notificationDoc.canteenId), eventPayload);
    return;
  }

  notifyGlobal(eventPayload);
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
  const targetRole = normalizeSystemRoleForFilter(role);
  const now = new Date();
  const activeRoleFilter = {
    isActive: true,
    activeFrom: { $lte: now },
    $or: [{ activeTo: null }, { activeTo: { $gte: now } }],
    targetRole: { $in: ["all", targetRole] },
  };

  const canteenScope = canteenId ? { $or: [{ canteenId }, { canteenId: null }] } : {};

  return mergeAndFilters(
    buildNotDeletedFilter(),
    activeRoleFilter,
    canteenScope,
    extraFilter,
  );
};

const assertValidObjectId = (value, message = "Notification not found") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 404);
  }
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

  let rows = await Notification.find(filter)
    .select("_id canteenId userId type title content isRead metadata createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Filter out notifications that reference orders which no longer exist (stale)
  try {
    const referencedOrderIds = Array.from(
      new Set(
        rows
          .map((r) => r?.metadata?.orderId)
          .filter((id) => id !== undefined && id !== null && id !== ""),
      ),
    );

    if (referencedOrderIds.length > 0) {
      const existingOrders = await Order.find({ _id: { $in: referencedOrderIds } }).select('_id').lean();
      const existingSet = new Set(existingOrders.map((o) => String(o._id)));

      const stale = rows.filter(
        (r) => r?.metadata?.orderId && !existingSet.has(String(r.metadata.orderId)),
      );

      if (stale.length > 0) {
        const staleIds = stale.map((s) => String(s._id));
        try {
          await Notification.deleteMany({ _id: { $in: staleIds } });
        } catch (err) {
          console.error('Failed to delete stale notifications:', err?.message || err);
        }

        try {
          // Tell client(s) to remove these notifications from UI
          notifyRemoveNotifications(String(userId), { ids: staleIds });
        } catch (err) {
          console.error('Failed to emit remove event for stale notifications:', err?.message || err);
        }

        // Remove from rows returned
        rows = rows.filter((r) => !staleIds.includes(String(r._id)));
      }
    }
  } catch (err) {
    console.error('Error while cleaning stale notifications:', err?.message || err);
  }

  return rows;
};

export const getNotificationById = async (
  notificationId,
  userId,
  canteenId = null,
  role = "customer",
) => {
  assertValidObjectId(notificationId);

  const personalFilter = withPersonalScope(
    {
      _id: notificationId,
      userId,
    },
    canteenId,
    role,
  );

  const personal = await Notification.findOne(personalFilter)
    .select("_id canteenId type title content isRead metadata createdAt")
    .lean();

  if (personal) {
    // If this personal notification references an order that no longer exists,
    // treat it as not found: cleanup and return 404 so client won't show stale data.
    try {
      const refOrderId = personal?.metadata?.orderId;
      if (refOrderId) {
        const exists = await Order.exists({ _id: refOrderId });
        if (!exists) {
          try {
            await Notification.deleteOne({ _id: personal._id });
          } catch (err) {
            console.error('Failed deleting stale personal notification:', err?.message || err);
          }
          try {
            notifyRemoveNotifications(String(userId), { ids: [String(personal._id)], orderId: String(refOrderId) });
          } catch (err) {
            console.error('Failed to emit remove event for stale personal notification:', err?.message || err);
          }
          throw new AppError('Notification not found', 404);
        }
      }
    } catch (err) {
      // If check fails for any reason, log and continue to return personal
      console.error('Error while validating personal notification order ref:', err?.message || err);
    }

    return personal;
  }

  const systemFilter = buildActiveSystemFilter(role, canteenId, {
    _id: notificationId,
  });

  const systemNotification = await SystemNotification.findOne(systemFilter)
    .select("_id canteenId title content createdAt")
    .lean();

  if (!systemNotification) {
    throw new AppError("Notification not found", 404);
  }

  const readDoc = await SystemNotificationRead.findOne({
    userId,
    systemNotificationId: systemNotification._id,
  })
    .select("_id")
    .lean();

  return {
    _id: systemNotification._id,
    canteenId: systemNotification.canteenId || null,
    type: "system",
    title: systemNotification.title,
    content: systemNotification.content,
    isRead: Boolean(readDoc),
    metadata: null,
    createdAt: systemNotification.createdAt,
  };
};

export const getUnreadCount = async (userId, canteenId = null, role = "customer") => {
  const personalUnread = await Notification.countDocuments(
    withPersonalScope({ userId, isRead: false }, canteenId, role),
  );

  const systemFilter = buildActiveSystemFilter(role, canteenId);

  const activeSystemIds = await SystemNotification.find(systemFilter).distinct("_id");
  if (!activeSystemIds.length) return personalUnread;

  const personalSystemRows = await Notification.find(
    withPersonalScope(
      {
        userId,
        type: "system",
      },
      canteenId,
      role,
    ),
  )
    .select("metadata.systemNotificationId")
    .lean();

  const dispatchedSystemIds = new Set(
    personalSystemRows
      .map((item) => toObjectIdString(item?.metadata?.systemNotificationId))
      .filter(Boolean),
  );

  const templateOnlyIds = activeSystemIds.filter(
    (id) => !dispatchedSystemIds.has(toObjectIdString(id)),
  );

  if (!templateOnlyIds.length) {
    return personalUnread;
  }

  const readSystemCount = await SystemNotificationRead.countDocuments({
    userId,
    systemNotificationId: { $in: templateOnlyIds },
  });

  const systemUnread = Math.max(templateOnlyIds.length - readSystemCount, 0);
  return personalUnread + systemUnread;
};

export const markAsRead = async (
  notificationId,
  userId,
  canteenId = null,
  role = "customer",
) => {
  assertValidObjectId(notificationId);

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

  const systemFilter = buildActiveSystemFilter(role, canteenId, {
    _id: notificationId,
  });
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

export const createSystemNotification = async (notificationData, actor) => {
  assertSystemNotificationAccess(actor);

  const payload = normalizeSystemNotificationPayload(notificationData, actor);

  if (!payload.title) {
    throw new AppError("Tiêu đề thông báo là bắt buộc", 400);
  }

  if (!payload.content) {
    throw new AppError("Nội dung thông báo là bắt buộc", 400);
  }

  const notification = await SystemNotification.create({
    ...removeUndefinedFields(payload),
    createdBy: actor?._id,
  });

  const dispatchResult = await dispatchSystemNotification(notification);

  if (!dispatchResult.dispatched) {
    emitRealtimeSystemNotification(notification);
  }

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
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
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

  let readSet = new Set();
  if (systemRows.length > 0) {
    const systemIds = systemRows.map((item) => item._id);
    const readRows = await SystemNotificationRead.find({
      userId,
      systemNotificationId: { $in: systemIds },
    })
      .select("systemNotificationId")
      .lean();

    readSet = new Set(
      readRows.map((item) => toObjectIdString(item.systemNotificationId)).filter(Boolean),
    );
  }

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
    createdAtMs: item.createdAt ? new Date(item.createdAt).getTime() : 0,
    sortKey: toObjectIdString(item._id) || "",
  }));

  const dispatchedSystemIds = new Set(
    personalRows
      .filter((item) => item?.type === "system")
      .map((item) => toObjectIdString(item?.metadata?.systemNotificationId))
      .filter(Boolean),
  );

  const normalizedSystemBase = systemRows
    .filter((item) => !dispatchedSystemIds.has(toObjectIdString(item._id)))
    .map((item) => ({
      _id: item._id,
      source: "system",
      canteenId: item.canteenId || null,
      type: "system",
      title: item.title,
      content: item.content,
      isRead: readSet.has(toObjectIdString(item._id)),
      metadata: null,
      createdAt: item.createdAt,
      createdAtMs: item.createdAt ? new Date(item.createdAt).getTime() : 0,
      sortKey: toObjectIdString(item._id) || "",
    }));

  const normalizedSystem = parsedIsRead === undefined
    ? normalizedSystemBase
    : normalizedSystemBase.filter((item) => item.isRead === parsedIsRead);

  const merged = [...normalizedPersonal, ...normalizedSystem];
  merged.sort((a, b) => {
    if (a.createdAtMs === b.createdAtMs) {
      return b.sortKey.localeCompare(a.sortKey);
    }
    return b.createdAtMs - a.createdAtMs;
  });

  const hasNextPage = merged.length > limit;
  const data = (hasNextPage ? merged.slice(0, limit) : merged).map((item) => ({
    _id: item._id,
    source: item.source,
    canteenId: item.canteenId,
    type: item.type,
    title: item.title,
    content: item.content,
    isRead: item.isRead,
    metadata: item.metadata,
    createdAt: item.createdAt,
  }));
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

export const getAllSystemNotifications = async (query = {}, actor) => {
  assertSystemNotificationAccess(actor);

  const role = normalizeRole(actor?.role);
  const normalizedQuery = { ...query };

  const lifecycleFilter = buildSystemLifecycleFilter(normalizedQuery.lifecycle);
  delete normalizedQuery.lifecycle;

  const scope = String(normalizedQuery.scope || "").trim().toLowerCase();
  delete normalizedQuery.scope;

  if (isManagerRole(role)) {
    delete normalizedQuery.canteenId;
  }

  let scopeFilter = buildSystemReadableScope(actor);

  if (scope) {
    if (scope !== "all" && scope !== "global" && scope !== "canteen") {
      throw new AppError("Giá trị scope không hợp lệ", 400);
    }

    if (scope === "global") {
      scopeFilter = mergeAndFilters(scopeFilter, { canteenId: null });
    }

    if (scope === "canteen") {
      scopeFilter = mergeAndFilters(scopeFilter, { canteenId: { $ne: null } });
    }
  }

  const baseFilter = mergeAndFilters(
    buildNotDeletedFilter(),
    scopeFilter,
    lifecycleFilter,
  );

  return paginatedQuery(SystemNotification, normalizedQuery, {
    allowedFilters: ["targetRole", "isActive", "canteenId", "createdBy"],
    searchFields: ["title", "content"],
    allowedSortFields: ["createdAt", "activeFrom", "activeTo", "updatedAt"],
    baseFilter,
    populate: [
      { path: "canteenId", select: "name location" },
      { path: "createdBy", select: "fullName email role" },
    ],
  });
};

export const getSystemNotificationById = async (id, actor) => {
  assertSystemNotificationAccess(actor);

  const filter = mergeAndFilters(
    { _id: id },
    buildNotDeletedFilter(),
    buildSystemReadableScope(actor),
  );

  const notification = await SystemNotification.findOne(filter).populate(
    "createdBy",
    "fullName email role",
  );

  if (!notification) {
    throw new AppError("System notification not found", 404);
  }
  return notification;
};

export const updateSystemNotification = async (id, updateData, actor) => {
  assertSystemNotificationAccess(actor);

  const role = normalizeRole(actor?.role);
  const writableScope = buildSystemWritableScope(actor);
  const existing = await SystemNotification.findOne(
    mergeAndFilters({ _id: id }, writableScope, buildNotDeletedFilter()),
  );

  if (!existing) {
    throw new AppError("System notification not found", 404);
  }

  const payload = normalizeSystemNotificationPayload(updateData, actor);

  if (isManagerRole(role)) {
    payload.canteenId = actor?.canteenId;
  }

  if (payload.title !== undefined && !payload.title) {
    throw new AppError("Tiêu đề thông báo là bắt buộc", 400);
  }

  if (payload.content !== undefined && !payload.content) {
    throw new AppError("Nội dung thông báo là bắt buộc", 400);
  }

  const notification = await SystemNotification.findByIdAndUpdate(
    existing._id,
    removeUndefinedFields(payload),
    {
      new: true,
      runValidators: true,
    },
  );

  return notification;
};

export const deleteSystemNotification = async (id, actor) => {
  assertSystemNotificationAccess(actor);

  const notification = await SystemNotification.findOne(
    mergeAndFilters(
      { _id: id },
      buildSystemWritableScope(actor),
      buildNotDeletedFilter(),
    ),
  );

  if (!notification) {
    throw new AppError("System notification not found", 404);
  }

  notification.isDeleted = true;
  notification.deletedAt = new Date();
  notification.isActive = false;
  await notification.save();
};
