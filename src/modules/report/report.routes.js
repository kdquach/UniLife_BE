import express from "express";
import * as reportController from "./report.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(restrictTo("admin", "manager"));

// Report Snapshot routes
router.post("/snapshots/generate-daily", reportController.generateDailyReport);
router.post("/snapshots", reportController.createReportSnapshot);
router.get(
  "/snapshots/canteen/:canteenId",
  reportController.getReportSnapshots,
);
router
  .route("/snapshots/:id")
  .get(reportController.getReportSnapshotById)
  .delete(reportController.deleteReportSnapshot);

// Audit Log routes
router.get("/audit-logs", reportController.getAuditLogs);
router.get(
  "/audit-logs/:entity/:entityId",
  reportController.getAuditLogsByEntity,
);

// Shift Summary routes
router.get(
  "/shift-summaries/canteen/:canteenId",
  reportController.getShiftSummaries,
);
router.post("/shift-summaries", reportController.createShiftSummary);
router
  .route("/shift-summaries/:id")
  .get(reportController.getShiftSummaryById)
  .patch(reportController.reviewShiftSummary);

// Pickup Log routes
router.get(
  "/pickup-logs/order/:orderId",
  reportController.getPickupLogsByOrder,
);
router.get("/pickup-logs/canteen/:canteenId", reportController.getPickupLogs);
router.post("/pickup-logs", reportController.createPickupLog);

export default router;
