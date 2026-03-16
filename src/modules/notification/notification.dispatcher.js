import User from "../user/user.model.js";
import { Notification, SystemNotification } from "./notification.model.js";
import { notifyUser } from "../../websocket/notify.js";

const toObjectIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.toString) return value.toString();
  return null;
};

const buildTargetUserFilter = (notificationDoc = {}) => {
  const targetRole = String(notificationDoc.targetRole || "all").toLowerCase();
  const canteenId = notificationDoc.canteenId || null;

  return {
    status: "active",
    ...(targetRole !== "all" && { role: targetRole }),
    ...(canteenId && { canteenId }),
  };
};

const isDispatchableNow = (notificationDoc = {}) => {
  if (!notificationDoc || notificationDoc.isActive === false || notificationDoc.isDeleted) {
    return false;
  }

  const now = Date.now();
  const activeFromMs = notificationDoc.activeFrom
    ? new Date(notificationDoc.activeFrom).getTime()
    : null;
  const activeToMs = notificationDoc.activeTo
    ? new Date(notificationDoc.activeTo).getTime()
    : null;

  if (activeFromMs && activeFromMs > now) {
    return false;
  }

  if (activeToMs && activeToMs < now) {
    return false;
  }

  return true;
};

export const resolveTargetUsers = async (notificationDoc = {}) => {
  const filter = buildTargetUserFilter(notificationDoc);

  const rows = await User.find(filter).select("_id").lean();
  return rows.map((item) => item._id).filter(Boolean);
};

export const dispatchSystemNotification = async (notificationDoc = {}) => {
  if (!notificationDoc?._id) {
    return {
      dispatched: false,
      reason: "missing_notification_id",
      insertedCount: 0,
    };
  }

  if (notificationDoc.dispatchedAt) {
    return {
      dispatched: false,
      reason: "already_dispatched",
      insertedCount: 0,
    };
  }

  if (!isDispatchableNow(notificationDoc)) {
    return {
      dispatched: false,
      reason: "not_active_window",
      insertedCount: 0,
    };
  }

  const targetUserIds = await resolveTargetUsers(notificationDoc);

  if (!targetUserIds.length) {
    await SystemNotification.findByIdAndUpdate(notificationDoc._id, {
      dispatchedAt: new Date(),
    });

    return {
      dispatched: true,
      reason: "no_target_users",
      insertedCount: 0,
    };
  }

  const payload = targetUserIds.map((userId) => ({
    userId,
    canteenId: notificationDoc.canteenId || null,
    type: "system",
    title: notificationDoc.title,
    content: notificationDoc.content,
    metadata: {
      source: "system_notification_dispatch",
      systemNotificationId: notificationDoc._id,
    },
  }));

  const createdRows = await Notification.insertMany(payload, { ordered: false });

  createdRows.forEach((item) => {
    notifyUser(toObjectIdString(item.userId), {
      id: item._id,
      type: item.type,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
      meta: item.metadata || {},
    });
  });

  await SystemNotification.findByIdAndUpdate(notificationDoc._id, {
    dispatchedAt: new Date(),
  });

  return {
    dispatched: true,
    reason: "ok",
    insertedCount: createdRows.length,
  };
};
