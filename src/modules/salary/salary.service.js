import Salary from "./salary.model.js";
import ShiftAssignment from "../shift/shiftAssignment.model.js";
import AppError from "../../utils/AppError.js";
import mongoose from "mongoose";

/**
 * Create a new salary record
 * @param {Object} salaryData - Salary data
 * @returns {Promise<Object>} Created salary
 */
export const createSalary = async (salaryData) => {
  const salary = await Salary.create(salaryData);
  return salary;
};

/**
 * Get all salaries
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Array of salaries
 */
export const getAllSalaries = async (query = {}) => {
  const filter = {};

  if (query.userId) {
    filter.userId = query.userId;
  }
  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  // Period filter
  if (query.periodStart) {
    filter.periodStart = { $gte: new Date(query.periodStart) };
  }
  if (query.periodEnd) {
    filter.periodEnd = { $lte: new Date(query.periodEnd) };
  }

  const salaries = await Salary.find(filter)
    .populate("userId", "name email")
    .populate("canteenId", "name")
    .sort({ periodEnd: -1 });

  return salaries;
};

/**
 * Get salary by ID
 * @param {string} id - Salary ID
 * @returns {Promise<Object>} Salary object
 */
export const getSalaryById = async (id) => {
  const salary = await Salary.findById(id)
    .populate("userId", "name email")
    .populate("canteenId", "name location");

  if (!salary) {
    throw new AppError("Salary record not found", 404);
  }
  return salary;
};

/**
 * Get salaries by user
 * @param {string} userId - User ID
 * @param {Object} query - Additional query parameters
 * @returns {Promise<Array>} Array of salaries
 */
export const getSalariesByUser = async (userId, query = {}) => {
  const filter = { userId };

  if (query.status) {
    filter.status = query.status;
  }
  if (query.year) {
    const year = parseInt(query.year);
    filter.periodStart = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    };
  }

  const salaries = await Salary.find(filter)
    .populate("canteenId", "name")
    .sort({ periodEnd: -1 });

  return salaries;
};

/**
 * Update salary
 * @param {string} id - Salary ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated salary
 */
export const updateSalary = async (id, updateData) => {
  const salary = await Salary.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!salary) {
    throw new AppError("Salary record not found", 404);
  }

  return salary;
};

/**
 * Delete salary
 * @param {string} id - Salary ID
 */
export const deleteSalary = async (id) => {
  const salary = await Salary.findByIdAndDelete(id);
  if (!salary) {
    throw new AppError("Salary record not found", 404);
  }
};

/**
 * Calculate salary for a user based on shift assignments
 * @param {string} userId - User ID
 * @param {string} canteenId - Canteen ID
 * @param {Date} periodStart - Period start date
 * @param {Date} periodEnd - Period end date
 * @param {number} hourlyRate - Hourly rate
 * @returns {Promise<Object>} Calculated salary record
 */
export const calculateSalary = async (
  userId,
  canteenId,
  periodStart,
  periodEnd,
  hourlyRate,
) => {
  // Get all checked out assignments for the period
  const assignments = await ShiftAssignment.find({
    userId,
    canteenId,
    status: "checked_out",
    checkInTime: { $gte: new Date(periodStart) },
    checkOutTime: { $lte: new Date(periodEnd) },
  });

  // Calculate total hours worked
  let totalHours = 0;
  for (const assignment of assignments) {
    if (assignment.checkInTime && assignment.checkOutTime) {
      const hours =
        (assignment.checkOutTime - assignment.checkInTime) / (1000 * 60 * 60);
      totalHours += hours;
    }
  }

  // Round to 2 decimal places
  totalHours = Math.round(totalHours * 100) / 100;

  // Calculate base salary
  const baseSalary = totalHours * hourlyRate;

  // Check if salary record already exists for this period
  const existingSalary = await Salary.findOne({
    userId,
    canteenId,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
  });

  if (existingSalary) {
    // Update existing record
    existingSalary.totalHours = totalHours;
    existingSalary.baseSalary = baseSalary;
    existingSalary.status = "calculated";
    existingSalary.calculatedAt = new Date();
    await existingSalary.save();
    return existingSalary;
  }

  // Create new salary record
  const salary = await Salary.create({
    userId,
    canteenId,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    totalHours,
    baseSalary,
    status: "calculated",
    calculatedAt: new Date(),
  });

  return salary;
};

/**
 * Approve salary
 * @param {string} id - Salary ID
 * @returns {Promise<Object>} Approved salary
 */
export const approveSalary = async (id) => {
  const salary = await Salary.findById(id);

  if (!salary) {
    throw new AppError("Salary record not found", 404);
  }

  if (salary.status !== "calculated") {
    throw new AppError("Salary must be calculated before approval", 400);
  }

  salary.status = "approved";
  await salary.save();

  return salary;
};

/**
 * Mark salary as paid
 * @param {string} id - Salary ID
 * @returns {Promise<Object>} Paid salary
 */
export const markAsPaid = async (id) => {
  const salary = await Salary.findById(id);

  if (!salary) {
    throw new AppError("Salary record not found", 404);
  }

  if (salary.status !== "approved") {
    throw new AppError("Salary must be approved before marking as paid", 400);
  }

  salary.status = "paid";
  salary.paidAt = new Date();
  await salary.save();

  return salary;
};

/**
 * Get salary statistics
 * @param {string} canteenId - Canteen ID
 * @param {Date} periodStart - Period start
 * @param {Date} periodEnd - Period end
 * @returns {Promise<Object>} Salary statistics
 */
export const getSalaryStats = async (canteenId, periodStart, periodEnd) => {
  const stats = await Salary.aggregate([
    {
      $match: {
        canteenId: new mongoose.Types.ObjectId(canteenId),
        periodStart: { $gte: new Date(periodStart) },
        periodEnd: { $lte: new Date(periodEnd) },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalSalary" },
        totalHours: { $sum: "$totalHours" },
      },
    },
  ]);

  return stats;
};

/**
 * Bulk calculate salaries for all staff in a canteen
 * @param {string} canteenId - Canteen ID
 * @param {Date} periodStart - Period start
 * @param {Date} periodEnd - Period end
 * @param {number} hourlyRate - Hourly rate
 * @returns {Promise<Array>} Array of calculated salaries
 */
export const bulkCalculateSalaries = async (
  canteenId,
  periodStart,
  periodEnd,
  hourlyRate,
) => {
  // Get all unique users with checked out assignments in this period
  const assignments = await ShiftAssignment.aggregate([
    {
      $match: {
        canteenId: new mongoose.Types.ObjectId(canteenId),
        status: "checked_out",
        checkInTime: { $gte: new Date(periodStart) },
        checkOutTime: { $lte: new Date(periodEnd) },
      },
    },
    {
      $group: {
        _id: "$userId",
      },
    },
  ]);

  const salaries = [];

  for (const assignment of assignments) {
    const salary = await calculateSalary(
      assignment._id.toString(),
      canteenId,
      periodStart,
      periodEnd,
      hourlyRate,
    );
    salaries.push(salary);
  }

  return salaries;
};
