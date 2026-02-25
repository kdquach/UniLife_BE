import { getIO } from "./index.js";

const normalizeMeta = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const buildNotificationPayload = ({
  id,
  type = "system",
  scope = "user",
  title = "",
  content = "",
  isRead = false,
  createdAt,
  meta = {},
}) => {
  const safeId = id || `ws-${Date.now()}`;
  return {
    id: String(safeId),
    type,
    scope,
    title,
    content,
    isRead: Boolean(isRead),
    createdAt: createdAt || new Date().toISOString(),
    meta: normalizeMeta(meta),
  };
};

export const notifyUser = (userId, notification) => {
  if (!userId) return;
  const io = getIO();
  const event = buildNotificationPayload({ ...notification, scope: "user" });
  io.to(`user:${userId}`).emit("notification:new", event);
};

export const notifyCanteen = (canteenId, notification) => {
  if (!canteenId) return;
  const io = getIO();
  const event = buildNotificationPayload({ ...notification, scope: "canteen" });
  io.to(`canteen:${canteenId}`).emit("notification:new", event);
};

export const notifyUsersInCanteen = (userIds = [], canteenId, notification) => {
  if (!canteenId || userIds.length === 0) return;
  const io = getIO();
  const event = buildNotificationPayload({ ...notification, scope: "canteen" });

  userIds.forEach((userId) => {
    if (!userId) return;
    io.to(`user:${userId}`).emit("notification:new", event);
  });
};

export const notifyGlobal = (notification) => {
  const io = getIO();
  const event = buildNotificationPayload({ ...notification, scope: "global" });
  io.emit("notification:new", event);
};
