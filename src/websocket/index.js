import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("register", ({ userId, canteenId } = {}) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
      if (canteenId) {
        socket.join(`canteen:${canteenId}`);
      }
    });

    socket.on("join:canteen", (canteenId) => {
      if (canteenId) {
        socket.join(`canteen:${canteenId}`);
      }
    });

    socket.on("leave:canteen", (canteenId) => {
      if (canteenId) {
        socket.leave(`canteen:${canteenId}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
};
