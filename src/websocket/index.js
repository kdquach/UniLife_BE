import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../modules/user/user.model.js";
import { isTokenBlacklisted } from "../modules/auth/auth.service.js";

let io;

const toStringId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?.toString) return value.toString();
  return "";
};

const normalizeToken = (rawToken = "") => {
  if (!rawToken) return "";
  return rawToken.startsWith("Bearer ") ? rawToken.slice(7).trim() : rawToken;
};

const canJoinCanteenRoom = (socket, canteenId) => {
  const requested = toStringId(canteenId);
  if (!requested) return false;

  const user = socket.user || {};
  if (user.role === "admin") return true;

  const userCanteenId = toStringId(user.canteenId);
  return Boolean(userCanteenId) && userCanteenId === requested;
};

const joinCanteenRoomSafely = (socket, canteenId, source = "client") => {
  const canteenKey = toStringId(canteenId);
  if (!canteenKey) return;

  if (!canJoinCanteenRoom(socket, canteenKey)) {
    console.warn(
      `[Socket] Join denied | user=${toStringId(socket.user?._id)} role=${socket.user?.role || "unknown"} canteen=${canteenKey} source=${source}`,
    );
    return;
  }

  socket.join(`canteen:${canteenKey}`);
  console.info(
    `[Socket] Joined room | user=${toStringId(socket.user?._id)} room=canteen:${canteenKey} source=${source}`,
  );
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = normalizeToken(socket.handshake?.auth?.token || "");
      if (!token) {
        const error = new Error("Unauthorized: missing token");
        error.data = { code: "SOCKET_UNAUTHORIZED" };
        return next(error);
      }

      if (isTokenBlacklisted(token)) {
        const error = new Error("Unauthorized: token blacklisted");
        error.data = { code: "SOCKET_UNAUTHORIZED" };
        return next(error);
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id)
        .select("_id role canteenId status")
        .lean();

      if (!user || user.status !== "active") {
        const error = new Error("Unauthorized: user invalid");
        error.data = { code: "SOCKET_UNAUTHORIZED" };
        return next(error);
      }

      socket.user = user;
      return next();
    } catch {
      const error = new Error("Unauthorized: invalid token");
      error.data = { code: "SOCKET_UNAUTHORIZED" };
      return next(error);
    }
  });

  io.on("connection", (socket) => {
    const userId = toStringId(socket.user?._id);
    if (userId) {
      socket.join(`user:${userId}`);
      console.info(`[Socket] Joined room | user=${userId} room=user:${userId} source=server`);
    }

    if (socket.user?.canteenId) {
      joinCanteenRoomSafely(socket, socket.user.canteenId, "server");
    }

    socket.on("register", ({ canteenId } = {}) => {
      if (canteenId) {
        joinCanteenRoomSafely(socket, canteenId, "register");
      }
    });

    socket.on("join:canteen", (canteenId) => {
      joinCanteenRoomSafely(socket, canteenId, "join:canteen");
    });

    socket.on("leave:canteen", (canteenId) => {
      const canteenKey = toStringId(canteenId);
      if (!canteenKey) return;
      if (!canJoinCanteenRoom(socket, canteenKey)) {
        console.warn(
          `[Socket] Leave denied | user=${toStringId(socket.user?._id)} role=${socket.user?.role || "unknown"} canteen=${canteenKey}`,
        );
        return;
      }
      socket.leave(`canteen:${canteenKey}`);
      console.info(
        `[Socket] Left room | user=${toStringId(socket.user?._id)} room=canteen:${canteenKey}`,
      );
    });
  });

  // Scale note: for multi-instance deployment, attach a Redis adapter here
  // so room broadcasts are shared across all Node.js processes/containers.

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
};
