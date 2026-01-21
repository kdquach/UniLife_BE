import catchAsync from "../../utils/catchAsync.js";
import * as salaryService from "./salary.service.js";

/**
 * Create a new salary record
 * @route POST /api/salaries
 * @access Private (Admin)
 */
export const createSalary = catchAsync(async (req, res) => {
  const salary = await salaryService.createSalary(req.body);

  res.status(201).json({
    status: "success",
    data: {
      salary,
    },
  });
});

/**
 * Get all salaries
 * @route GET /api/salaries
 * @access Private (Admin)
 */
export const getAllSalaries = catchAsync(async (req, res) => {
  const salaries = await salaryService.getAllSalaries(req.query);

  res.status(200).json({
    status: "success",
    results: salaries.length,
    data: {
      salaries,
    },
  });
});

/**
 * Get salary by ID
 * @route GET /api/salaries/:id
 * @access Private
 */
export const getSalaryById = catchAsync(async (req, res) => {
  const salary = await salaryService.getSalaryById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      salary,
    },
  });
});

/**
 * Get my salaries
 * @route GET /api/salaries/my-salaries
 * @access Private (Staff)
 */
export const getMySalaries = catchAsync(async (req, res) => {
  const salaries = await salaryService.getSalariesByUser(
    req.user._id,
    req.query,
  );

  res.status(200).json({
    status: "success",
    results: salaries.length,
    data: {
      salaries,
    },
  });
});

/**
 * Update salary
 * @route PATCH /api/salaries/:id
 * @access Private (Admin)
 */
export const updateSalary = catchAsync(async (req, res) => {
  const salary = await salaryService.updateSalary(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      salary,
    },
  });
});

/**
 * Delete salary
 * @route DELETE /api/salaries/:id
 * @access Private (Admin)
 */
export const deleteSalary = catchAsync(async (req, res) => {
  await salaryService.deleteSalary(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Calculate salary for a user
 * @route POST /api/salaries/calculate
 * @access Private (Admin)
 */
export const calculateSalary = catchAsync(async (req, res) => {
  const { userId, canteenId, periodStart, periodEnd, hourlyRate } = req.body;

  const salary = await salaryService.calculateSalary(
    userId,
    canteenId,
    periodStart,
    periodEnd,
    hourlyRate,
  );

  res.status(200).json({
    status: "success",
    data: {
      salary,
    },
  });
});

/**
 * Bulk calculate salaries
 * @route POST /api/salaries/bulk-calculate
 * @access Private (Admin)
 */
export const bulkCalculateSalaries = catchAsync(async (req, res) => {
  const { canteenId, periodStart, periodEnd, hourlyRate } = req.body;

  const salaries = await salaryService.bulkCalculateSalaries(
    canteenId,
    periodStart,
    periodEnd,
    hourlyRate,
  );

  res.status(200).json({
    status: "success",
    results: salaries.length,
    data: {
      salaries,
    },
  });
});

/**
 * Approve salary
 * @route PATCH /api/salaries/:id/approve
 * @access Private (Admin)
 */
export const approveSalary = catchAsync(async (req, res) => {
  const salary = await salaryService.approveSalary(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      salary,
    },
  });
});

/**
 * Mark salary as paid
 * @route PATCH /api/salaries/:id/pay
 * @access Private (Admin)
 */
export const markAsPaid = catchAsync(async (req, res) => {
  const salary = await salaryService.markAsPaid(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      salary,
    },
  });
});

/**
 * Get salary statistics
 * @route GET /api/salaries/stats
 * @access Private (Admin)
 */
export const getSalaryStats = catchAsync(async (req, res) => {
  const { canteenId, periodStart, periodEnd } = req.query;

  const stats = await salaryService.getSalaryStats(
    canteenId,
    periodStart,
    periodEnd,
  );

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});
