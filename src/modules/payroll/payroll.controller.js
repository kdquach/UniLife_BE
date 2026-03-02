import * as payrollService from "./payroll.service.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";

/**
 * Tạo kỳ lương mới
 * @route POST /api/payrolls
 * @access Private (Admin/Manager)
 */
export const createPayroll = catchAsync(async (req, res) => {
  const payroll = await payrollService.createPayroll(req.body);

  res.status(201).json({
    status: "success",
    data: {
      payroll,
    },
  });
});

/**
 * Lấy danh sách tất cả kỳ lương
 * @route GET /api/payrolls
 * @access Private (Admin/Manager)
 */
export const getAllPayrolls = catchAsync(async (req, res) => {
  const payrolls = await payrollService.getAllPayrolls(req.query);

  res.status(200).json({
    status: "success",
    results: payrolls.length,
    data: {
      payrolls,
    },
  });
});

/**
 * Lấy chi tiết một kỳ lương
 * @route GET /api/payrolls/:id
 * @access Private (Admin/Manager)
 */
export const getPayrollById = catchAsync(async (req, res) => {
  const result = await payrollService.getPayrollById(req.params.id);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Generate payroll - Tạo kỳ lương và tính lương tự động
 * @route POST /api/payrolls/generate
 * @access Private (Admin/Manager)
 */
export const generatePayroll = catchAsync(async (req, res) => {
  const { canteenId, periodStart, periodEnd, hourlyRate, description } =
    req.body;
  const createdBy = req.user._id;

  // Validation
  if (!canteenId) {
    throw new AppError("Canteen ID is required", 400);
  }
  if (!periodStart || !periodEnd) {
    throw new AppError("Period start and end dates are required", 400);
  }
  if (!hourlyRate || hourlyRate <= 0) {
    throw new AppError("Valid hourly rate is required", 400);
  }

  const result = await payrollService.generatePayroll(
    canteenId,
    periodStart,
    periodEnd,
    hourlyRate,
    createdBy,
    description,
  );

  res.status(201).json({
    status: "success",
    message: `Đã tạo kỳ lương cho ${result.salaries.length} nhân viên`,
    data: result,
  });
});

/**
 * Điều chỉnh lương của một nhân viên
 * @route PATCH /api/payrolls/:payrollId/salaries/:salaryId
 * @access Private (Admin/Manager)
 */
export const adjustSalary = catchAsync(async (req, res) => {
  const { payrollId, salaryId } = req.params;
  const salary = await payrollService.adjustSalary(
    payrollId,
    salaryId,
    req.body,
  );

  res.status(200).json({
    status: "success",
    message: "Đã điều chỉnh lương",
    data: {
      salary,
    },
  });
});

/**
 * Duyệt kỳ lương
 * @route PATCH /api/payrolls/:id/approve
 * @access Private (Admin/Manager)
 */
export const approvePayroll = catchAsync(async (req, res) => {
  const approvedBy = req.user._id;
  const payroll = await payrollService.approvePayroll(
    req.params.id,
    approvedBy,
  );

  res.status(200).json({
    status: "success",
    message: "Đã duyệt kỳ lương",
    data: {
      payroll,
    },
  });
});

/**
 * Xác nhận thanh toán
 * @route PATCH /api/payrolls/:id/pay
 * @access Private (Admin/Manager)
 */
export const confirmPayment = catchAsync(async (req, res) => {
  const paidBy = req.user._id;
  const payroll = await payrollService.confirmPayment(req.params.id, paidBy);

  res.status(200).json({
    status: "success",
    message: "Đã xác nhận thanh toán kỳ lương",
    data: {
      payroll,
    },
  });
});

/**
 * Xóa kỳ lương
 * @route DELETE /api/payrolls/:id
 * @access Private (Admin)
 */
export const deletePayroll = catchAsync(async (req, res) => {
  await payrollService.deletePayroll(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Lấy thống kê payroll
 * @route GET /api/payrolls/stats
 * @access Private (Admin/Manager)
 */
export const getPayrollStats = catchAsync(async (req, res) => {
  const stats = await payrollService.getPayrollStats(req.query);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});
