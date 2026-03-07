import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { registerOrderCronJobs } from "./jobs/orderCron.js";
import { registerScheduleReminderCronJobs } from "./jobs/scheduleReminderCron.js";
import { registerVoucherCronJobs } from "./jobs/voucherStatus.job.js";
import { registerExpireShiftChangeRequestCron } from "./cron/expireShiftRequests.job.js";
import { initSocket } from "./websocket/index.js";

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB();

// Register cron jobs
registerOrderCronJobs();
registerScheduleReminderCronJobs();
registerVoucherCronJobs();
registerExpireShiftChangeRequestCron();

// Start server
const server = app.listen(PORT, () => {
  initSocket(server);
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🍽️  UniLife Backend Server                              ║
  ║                                                           ║
  ║   Environment: ${process.env.NODE_ENV || "development"}                              ║
  ║   Port: ${PORT}                                             ║
  ║   API: http://localhost:${PORT}/api                         ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
