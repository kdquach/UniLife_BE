import express from "express";
import * as shiftController from "./shift.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// ============ Shift Assignment Routes ============
// Must be defined before /:id to avoid conflicts
router.get(
  "/my-assignments",
  restrictTo("staff", "manager", "admin"),
  shiftController.getMyAssignments,
);
router.get(
  "/assignments",
  restrictTo("staff", "manager", "admin"),
  shiftController.getShiftAssignments,
);
router.post(
  "/assignments",
  restrictTo("manager", "admin"),
  shiftController.assignUserToShift,
);
router.post(
  "/assignments/bulk-save",
  restrictTo("manager", "admin"),
  shiftController.bulkSaveAssignments,
);
router.post(
  "/assignments/publish",
  restrictTo("manager", "admin"),
  shiftController.publishAssignments,
);
router.post(
  "/assignments/:id/check-in",
  restrictTo("staff", "manager", "admin"),
  shiftController.checkIn,
);
router.post(
  "/assignments/:id/check-out",
  restrictTo("staff", "manager", "admin"),
  shiftController.checkOut,
);
router.patch(
  "/assignments/:id",
  restrictTo("manager", "admin"),
  shiftController.updateAssignment,
);
router.delete(
  "/assignments/:id",
  restrictTo("manager", "admin"),
  shiftController.removeUserFromShift,
);

router.get(
  "/staff",
  restrictTo("manager", "admin"),
  shiftController.getShiftManagerStaffList,
);

router.get(
  "/my-change-requests",
  restrictTo("staff", "manager", "admin"),
  shiftController.getMyShiftChangeRequests,
);
router.get(
  "/change-request",
  restrictTo("manager", "admin"),
  shiftController.getShiftChangeRequests,
);
router.post(
  "/change-request",
  restrictTo("staff", "manager", "admin"),
  shiftController.createShiftChangeRequest,
);
router.get(
  "/change-request/shifts",
  restrictTo("staff", "manager", "admin"),
  shiftController.getAvailableShiftsForChangeRequest,
);
router.patch(
  "/change-request/:id",
  restrictTo("manager", "admin"),
  shiftController.reviewShiftChangeRequest,
);

// ============ Shift Routes ============
router.get("/", restrictTo("staff", "manager", "admin"), shiftController.getAllShifts);
router.get("/:id", restrictTo("staff", "manager", "admin"), shiftController.getShiftById);

// Admin only
router.post("/", restrictTo("admin"), shiftController.createShift);
router.patch("/:id", restrictTo("admin"), shiftController.updateShift);
router.delete("/:id", restrictTo("admin"), shiftController.deleteShift);

export default router;
