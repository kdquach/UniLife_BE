import express from "express";
import * as salaryController from "./salary.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Staff routes - nhân viên xem lương của chính mình
router.get(
  "/my-salaries",
  restrictTo("staff", "canteen_owner", "admin"),
  salaryController.getMySalaries,
);

// Manager/Admin routes - quản lý lương của toàn bộ canteen
router.use(restrictTo("canteen_owner", "admin"));

router.get("/", salaryController.getAllSalaries);
router.get("/stats", salaryController.getSalaryStats);
router.post("/", salaryController.createSalary);
router.post("/calculate", salaryController.calculateSalary);
router.post("/bulk-calculate", salaryController.bulkCalculateSalaries);

router.get("/:id", salaryController.getSalaryById);
router.patch("/:id", salaryController.updateSalary);
router.patch("/:id/approve", salaryController.approveSalary);
router.patch("/:id/pay", salaryController.markAsPaid);
router.delete("/:id", salaryController.deleteSalary);

export default router;
