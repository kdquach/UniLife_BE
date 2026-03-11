import express from "express";
import * as shiftController from "./shift.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// ============ Shift Routes ============
router.get("/", restrictTo("staff", "manager", "admin"), shiftController.getAllShifts);
router.get("/:id", restrictTo("staff", "manager", "admin"), shiftController.getShiftById);

// Admin only
router.post("/", restrictTo("admin"), shiftController.createShift);
router.patch("/:id", restrictTo("admin"), shiftController.updateShift);
router.delete("/:id", restrictTo("admin"), shiftController.deleteShift);

export default router;
