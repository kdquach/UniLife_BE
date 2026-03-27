import express from "express";
import * as payrollController from "./payroll.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";
import { auditLogger } from "../auditLog/auditLog.middleware.js";

const router = express.Router();

// Áp dụng middleware bảo vệ cho tất cả routes
router.use(protect);
router.use(restrictTo("admin", "canteen_owner", "manager"));

// GET /api/payrolls/stats - Lấy thống kê (phải đặt trước /:id)
router.get("/stats", payrollController.getPayrollStats);

// POST /api/payrolls/generate - Generate payroll tự động
router.post(
  "/generate",
  auditLogger("CREATE", "Payroll", "Payroll"),
  payrollController.generatePayroll,
);

// Routes chính
router
  .route("/")
  .get(payrollController.getAllPayrolls)
  .post(
    auditLogger("CREATE", "Payroll", "Payroll"),
    payrollController.createPayroll,
  );

router
  .route("/:id")
  .get(payrollController.getPayrollById)
  .delete(
    restrictTo("admin", "manager"),
    auditLogger("DELETE", "Payroll", "Payroll"),
    payrollController.deletePayroll,
  );

// PATCH /api/payrolls/:id/approve - Duyệt kỳ lương
router.patch(
  "/:id/approve",
  auditLogger("UPDATE", "Payroll", "Payroll"),
  payrollController.approvePayroll,
);

// PATCH /api/payrolls/:id/pay - Xác nhận thanh toán
router.patch(
  "/:id/pay",
  auditLogger("UPDATE", "Payroll", "Payroll"),
  payrollController.confirmPayment,
);

// PATCH /api/payrolls/:payrollId/salaries/:salaryId - Điều chỉnh lương nhân viên
router.patch(
  "/:payrollId/salaries/:salaryId",
  auditLogger("UPDATE", "Payroll", "Payroll"),
  payrollController.adjustSalary,
);

// GET /api/payrolls/:id/export-excel - Xuất file Excel bảng lương
router.get("/:id/export-excel", payrollController.exportPayrollExcel);

export default router;
