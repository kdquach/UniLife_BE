import * as salaryRateService from "./salaryRate.service.js";
import catchAsync from "../../utils/catchAsync.js";

/**
 * Thiết lập mức lương cho nhân viên
 * @route POST /api/salary-rates
 * @access Private (Admin/Manager)
 */
export const setSalaryRate = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    updatedBy: req.user._id,
  };

  const salaryRate = await salaryRateService.setSalaryRate(data);

  res.status(200).json({
    status: "success",
    message: "Đã thiết lập mức lương",
    data: {
      salaryRate,
    },
  });
});

/**
 * Lấy mức lương của một nhân viên
 * @route GET /api/salary-rates/user/:userId
 * @access Private (Admin/Manager)
 */
export const getSalaryRateByUser = catchAsync(async (req, res) => {
  const salaryRate = await salaryRateService.getSalaryRateByUser(
    req.params.userId,
  );

  res.status(200).json({
    status: "success",
    data: {
      salaryRate,
    },
  });
});

/**
 * Lấy danh sách mức lương theo canteen
 * @route GET /api/salary-rates/canteen/:canteenId
 * @access Private (Admin/Manager)
 */
export const getSalaryRatesByCanteen = catchAsync(async (req, res) => {
  const salaryRates = await salaryRateService.getSalaryRatesByCanteen(
    req.params.canteenId,
  );

  res.status(200).json({
    status: "success",
    results: salaryRates.length,
    data: {
      salaryRates,
    },
  });
});

/**
 * Lấy tất cả mức lương
 * @route GET /api/salary-rates
 * @access Private (Admin/Manager)
 */
export const getAllSalaryRates = catchAsync(async (req, res) => {
  const salaryRates = await salaryRateService.getAllSalaryRates();

  res.status(200).json({
    status: "success",
    results: salaryRates.length,
    data: {
      salaryRates,
    },
  });
});

/**
 * Xóa mức lương
 * @route DELETE /api/salary-rates/user/:userId
 * @access Private (Admin)
 */
export const deleteSalaryRate = catchAsync(async (req, res) => {
  await salaryRateService.deleteSalaryRate(req.params.userId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
