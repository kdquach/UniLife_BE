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
  restrictTo("staff", "admin"),
  shiftController.getMyAssignments,
);
router.get(
  "/assignments",
  restrictTo("staff", "admin"),
  shiftController.getShiftAssignments,
);
router.post(
  "/assignments",
  restrictTo("admin"),
  shiftController.assignUserToShift,
);
router.post(
  "/assignments/:id/check-in",
  restrictTo("staff", "admin"),
  shiftController.checkIn,
);
router.post(
  "/assignments/:id/check-out",
  restrictTo("staff", "admin"),
  shiftController.checkOut,
);
router.patch(
  "/assignments/:id",
  restrictTo("admin"),
  shiftController.updateAssignment,
);
router.delete(
  "/assignments/:id",
  restrictTo("admin"),
  shiftController.removeUserFromShift,
);

// ============ Shift Routes ============
router.get("/", restrictTo("staff", "admin"), shiftController.getAllShifts);
router.get("/:id", restrictTo("staff", "admin"), shiftController.getShiftById);

// Admin only
router.post("/", restrictTo("admin"), shiftController.createShift);
router.patch("/:id", restrictTo("admin"), shiftController.updateShift);
router.delete("/:id", restrictTo("admin"), shiftController.deleteShift);

export default router;
