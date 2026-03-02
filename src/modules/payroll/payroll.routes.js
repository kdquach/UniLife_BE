import express from "express";
import * as payrollController from "./payroll.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Áp dụng middleware bảo vệ cho tất cả routes
router.use(protect);
router.use(restrictTo("admin", "canteen_owner"));

// GET /api/payrolls/stats - Lấy thống kê (phải đặt trước /:id)
router.get("/stats", payrollController.getPayrollStats);

// POST /api/payrolls/generate - Generate payroll tự động
router.post("/generate", payrollController.generatePayroll);

// Routes chính
router
  .route("/")
  .get(payrollController.getAllPayrolls)
  .post(payrollController.createPayroll);

router
  .route("/:id")
  .get(payrollController.getPayrollById)
  .delete(restrictTo("admin"), payrollController.deletePayroll);

// PATCH /api/payrolls/:id/approve - Duyệt kỳ lương
router.patch("/:id/approve", payrollController.approvePayroll);

// PATCH /api/payrolls/:id/pay - Xác nhận thanh toán
router.patch("/:id/pay", payrollController.confirmPayment);

// PATCH /api/payrolls/:payrollId/salaries/:salaryId - Điều chỉnh lương nhân viên
router.patch("/:payrollId/salaries/:salaryId", payrollController.adjustSalary);

export default router;
