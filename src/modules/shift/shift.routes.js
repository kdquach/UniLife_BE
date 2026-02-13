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

// ============ Shift Routes ============
router.get("/", restrictTo("staff", "manager", "admin"), shiftController.getAllShifts);
router.get("/:id", restrictTo("staff", "manager", "admin"), shiftController.getShiftById);

// Admin only
router.post("/", restrictTo("manager", "admin"), shiftController.createShift);
router.patch("/:id", restrictTo("manager", "admin"), shiftController.updateShift);
router.delete("/:id", restrictTo("manager", "admin"), shiftController.deleteShift);

export default router;
