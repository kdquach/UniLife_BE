import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../modules/user/user.model.js";
import { isTokenBlacklisted } from "../modules/auth/auth.service.js";

let io;

// Fallback cho môi trường local nếu chưa khai báo SOCKET_ORIGIN.
// Có thể override hoàn toàn bằng biến env.
const DEFAULT_SOCKET_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

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

// SOCKET_ORIGIN hỗ trợ:
// - "*" để mở toàn bộ origin (không khuyến nghị cho production)
// - 1 origin đơn: "http://localhost:5173"
// - nhiều origin ngăn cách dấu phẩy
//   "http://localhost:5173,http://localhost:5174"
const parseAllowedOrigins = () => {
  const raw = String(process.env.SOCKET_ORIGIN || "").trim();

  if (!raw) return DEFAULT_SOCKET_ORIGINS;
  if (raw === "*") return "*";

  const origins = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return origins.length ? origins : DEFAULT_SOCKET_ORIGINS;
};

const buildSocketCorsOptions = () => {
  const allowedOrigins = parseAllowedOrigins();

  // Khi FE dùng withCredentials=true thì không nên trả wildcard origin.
  // Hàm origin dưới đây sẽ phản hồi đúng origin nằm trong allow-list.
  const origin = (requestOrigin, callback) => {
    // request không có Origin (tool nội bộ, script server) thì cho qua.
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins === "*") {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Socket CORS blocked origin: ${requestOrigin}`), false);
  };

  return {
    origin,
    methods: ["GET", "POST"],
    credentials: true,
  };
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
  const corsOptions = buildSocketCorsOptions();

  io = new Server(httpServer, {
    cors: corsOptions,
  });

  console.info(
    `[Socket] CORS config | SOCKET_ORIGIN=${process.env.SOCKET_ORIGIN || "(default local origins)"}`,
  );

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
