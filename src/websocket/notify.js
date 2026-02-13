import { getIO } from "./index.js";

const buildEvent = ({ scope, userId, canteenId, payload }) => {
  const event = {
    type: "notification:new",
    scope,
    payload,
  };

  if (userId) event.userId = userId;
  if (canteenId) event.canteenId = canteenId;

  return event;
};

export const notifyUser = (userId, payload) => {
  if (!userId) return;
  const io = getIO();
  const event = buildEvent({ scope: "user", userId, payload });
  io.to(`user:${userId}`).emit("notification:new", event);
};

export const notifyCanteen = (canteenId, payload) => {
  if (!canteenId) return;
  const io = getIO();
  const event = buildEvent({ scope: "canteen", canteenId, payload });
  io.to(`canteen:${canteenId}`).emit("notification:new", event);
};

export const notifyUsersInCanteen = (userIds = [], canteenId, payload) => {
  if (!canteenId || userIds.length === 0) return;
  const io = getIO();
  const event = buildEvent({ scope: "canteen", canteenId, payload });

  userIds.forEach((userId) => {
    if (!userId) return;
    io.to(`user:${userId}`).emit("notification:new", event);
  });
};

export const notifyGlobal = (payload) => {
  const io = getIO();
  const event = buildEvent({ scope: "global", payload });
  io.emit("notification:new", event);
};
