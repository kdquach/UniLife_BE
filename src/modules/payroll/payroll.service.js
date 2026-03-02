import Payroll from "./payroll.model.js";
import Salary from "../salary/salary.model.js";
import SalaryRate from "../salaryRate/salaryRate.model.js";
import { StaffShift } from "../shift/staffShift.model.js";
import AppError from "../../utils/AppError.js";
import mongoose from "mongoose";

/**
 * Tạo kỳ lương mới (draft)
 * @param {Object} payrollData - Dữ liệu kỳ lương
 * @returns {Promise<Object>} Payroll đã tạo
 */
export const createPayroll = async (payrollData) => {
  // Kiểm tra xem đã có kỳ lương này chưa
  const existingPayroll = await Payroll.findOne({
    canteenId: payrollData.canteenId,
    periodStart: payrollData.periodStart,
    periodEnd: payrollData.periodEnd,
  });

  if (existingPayroll) {
    throw new AppError("Kỳ lương này đã tồn tại cho căng tin này", 400);
  }

  const payroll = await Payroll.create(payrollData);
  return payroll;
};

/**
 * Lấy tất cả kỳ lương
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Danh sách kỳ lương
 */
export const getAllPayrolls = async (query = {}) => {
  const filter = {};

  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  // Lọc theo thời gian
  if (query.periodStart) {
    filter.periodStart = { $gte: new Date(query.periodStart) };
  }
  if (query.periodEnd) {
    filter.periodEnd = { $lte: new Date(query.periodEnd) };
  }

  const payrolls = await Payroll.find(filter)
    .populate("canteenId", "name location")
    .populate("createdBy", "fullName email")
    .populate("approvedBy", "fullName email")
    .populate("paidBy", "fullName email")
    .sort({ periodEnd: -1 });

  return payrolls;
};

/**
 * Lấy thông tin chi tiết một kỳ lương
 * @param {string} id - Payroll ID
 * @returns {Promise<Object>} Thông tin payroll và danh sách salary
 */
export const getPayrollById = async (id) => {
  const payroll = await Payroll.findById(id)
    .populate("canteenId", "name location")
    .populate("createdBy", "fullName email")
    .populate("approvedBy", "fullName email")
    .populate("paidBy", "fullName email");

  if (!payroll) {
    throw new AppError("Không tìm thấy kỳ lương", 404);
  }

  // Lấy danh sách lương của nhân viên trong kỳ này
  const salaries = await Salary.find({ payrollId: id })
    .populate("userId", "fullName email phone")
    .sort({ totalSalary: -1 });

  return {
    payroll,
    salaries,
  };
};

/**
 * Generate payroll - Tạo kỳ lương và tính lương cho tất cả nhân viên
 * Ưu tiên sử dụng SalaryRate cá nhân, nếu không có thì dùng hourlyRate mặc định
 * @param {string} canteenId - Canteen ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {number} hourlyRate - Mức lương theo giờ mặc định (fallback)
 * @param {string} createdBy - User ID người tạo
 * @param {string} description - Mô tả kỳ lương
 * @returns {Promise<Object>} Payroll và salaries đã tạo
 */
export const generatePayroll = async (
  canteenId,
  periodStart,
  periodEnd,
  hourlyRate,
  createdBy,
  description = "",
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Generate Payroll - Input:", {
      canteenId,
      periodStart,
      periodEnd,
      hourlyRate,
      createdBy,
    });

    // 1. Kiểm tra payroll đã tồn tại chưa
    const existingPayroll = await Payroll.findOne({
      canteenId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });

    if (existingPayroll) {
      throw new AppError("Kỳ lương này đã tồn tại cho canteen này", 400);
    }

    // 2. Tạo Payroll (draft)
    const payroll = await Payroll.create(
      [
        {
          canteenId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          hourlyRate,
          status: "draft",
          description,
          createdBy,
        },
      ],
      { session },
    );

    // 3. Lấy tất cả staff shifts đã check out trong kỳ
    const staffShifts = await StaffShift.aggregate([
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
          totalHours: { $sum: "$actualWorkHours" },
          shiftCount: { $sum: 1 },
        },
      },
    ]);

    console.log("Staff Shifts found:", staffShifts.length);

    // 4. Lấy tất cả salary rates của canteen này
    const salaryRates = await SalaryRate.find({ canteenId })
      .select("userId hourlyRate")
      .lean();

    console.log("Salary Rates found:", salaryRates.length);

    const salaryRateMap = {};
    salaryRates.forEach((rate) => {
      if (rate.userId) {
        salaryRateMap[rate.userId.toString()] = rate.hourlyRate;
      }
    });

    // 5. Tạo salary records cho từng nhân viên
    const salaries = [];
    let totalStaff = 0;
    let totalHours = 0;
    let totalAmount = 0;

    for (const shift of staffShifts) {
      if (!shift._id) continue; // Bỏ qua nếu userId null

      const userId = shift._id.toString();
      const hours = shift.totalHours || 0;

      // Ưu tiên lấy hourlyRate từ SalaryRate, nếu không có thì dùng default
      const userHourlyRate = salaryRateMap[userId] || hourlyRate;
      const baseSalary = Math.round(hours * userHourlyRate);

      const salary = {
        payrollId: payroll[0]._id,
        userId: shift._id,
        canteenId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalHours: hours,
        baseSalary: baseSalary,
        bonus: 0,
        deduction: 0,
        totalSalary: baseSalary,
        status: "calculated",
        calculatedAt: new Date(),
      };

      salaries.push(salary);
      totalStaff++;
      totalHours += hours;
      totalAmount += baseSalary;
    }

    // 6. Insert tất cả salary records
    if (salaries.length > 0) {
      await Salary.insertMany(salaries, { session });
    }

    // 7. Update payroll với thống kê
    payroll[0].totalStaff = totalStaff;
    payroll[0].totalHours = totalHours;
    payroll[0].totalAmount = totalAmount;
    payroll[0].status = "calculated";
    await payroll[0].save({ session });

    await session.commitTransaction();

    return {
      payroll: payroll[0],
      salaries,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Điều chỉnh lương của một nhân viên trong kỳ lương
 * @param {string} payrollId - Payroll ID
 * @param {string} salaryId - Salary ID
 * @param {Object} updateData - Dữ liệu cần update (bonus, deduction, note)
 * @returns {Promise<Object>} Salary và Payroll đã update
 */
export const adjustSalary = async (payrollId, salaryId, updateData) => {
  // Kiểm tra payroll có bị lock không
  const payroll = await Payroll.findById(payrollId);
  if (!payroll) {
    throw new AppError("Không tìm thấy kỳ lương", 404);
  }

  if (payroll.isLocked) {
    throw new AppError("Kỳ lương đã bị khóa, không thể chỉnh sửa", 400);
  }

  if (payroll.status === "paid") {
    throw new AppError("Kỳ lương đã thanh toán, không thể chỉnh sửa", 400);
  }

  // Update salary
  const salary = await Salary.findOne({ _id: salaryId, payrollId });
  if (!salary) {
    throw new AppError("Không tìm thấy bản ghi lương", 404);
  }

  if (updateData.bonus !== undefined) salary.bonus = updateData.bonus;
  if (updateData.deduction !== undefined)
    salary.deduction = updateData.deduction;
  if (updateData.note !== undefined) salary.note = updateData.note;

  await salary.save();

  // Tính lại tổng của payroll
  await recalculatePayrollTotals(payrollId);

  return salary;
};

/**
 * Duyệt kỳ lương
 * @param {string} id - Payroll ID
 * @param {string} approvedBy - User ID người duyệt
 * @returns {Promise<Object>} Payroll đã duyệt
 */
export const approvePayroll = async (id, approvedBy) => {
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    throw new AppError("Không tìm thấy kỳ lương", 404);
  }

  if (payroll.status !== "calculated") {
    throw new AppError("Chỉ có thể duyệt kỳ lương đã tính toán", 400);
  }

  payroll.status = "approved";
  payroll.approvedBy = approvedBy;
  payroll.approvedAt = new Date();
  payroll.isLocked = true; // Khóa khi duyệt

  await payroll.save();

  // Update tất cả salary trong kỳ
  await Salary.updateMany({ payrollId: id }, { status: "approved" });

  return payroll;
};

/**
 * Xác nhận thanh toán kỳ lương
 * @param {string} id - Payroll ID
 * @param {string} paidBy - User ID người thanh toán
 * @returns {Promise<Object>} Payroll đã thanh toán
 */
export const confirmPayment = async (id, paidBy) => {
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    throw new AppError("Không tìm thấy kỳ lương", 404);
  }

  if (payroll.status !== "approved") {
    throw new AppError("Chỉ có thể thanh toán kỳ lương đã được duyệt", 400);
  }

  payroll.status = "paid";
  payroll.paidBy = paidBy;
  payroll.paidAt = new Date();

  await payroll.save();

  // Update tất cả salary trong kỳ
  await Salary.updateMany(
    { payrollId: id },
    { status: "paid", paidAt: new Date() },
  );

  return payroll;
};

/**
 * Xóa kỳ lương (chỉ xóa được draft/calculated)
 * @param {string} id - Payroll ID
 */
export const deletePayroll = async (id) => {
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    throw new AppError("Không tìm thấy kỳ lương", 404);
  }

  if (payroll.status === "approved" || payroll.status === "paid") {
    throw new AppError(
      "Không thể xóa kỳ lương đã duyệt hoặc đã thanh toán",
      400,
    );
  }

  // Xóa tất cả salary records
  await Salary.deleteMany({ payrollId: id });

  // Xóa payroll
  await Payroll.findByIdAndDelete(id);
};

/**
 * Tính lại tổng của payroll từ các salary
 * @param {string} payrollId - Payroll ID
 */
const recalculatePayrollTotals = async (payrollId) => {
  const stats = await Salary.aggregate([
    {
      $match: {
        payrollId: new mongoose.Types.ObjectId(payrollId),
      },
    },
    {
      $group: {
        _id: null,
        totalStaff: { $sum: 1 },
        totalHours: { $sum: "$totalHours" },
        totalAmount: { $sum: "$totalSalary" },
        totalBonus: { $sum: "$bonus" },
        totalDeduction: { $sum: "$deduction" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Payroll.findByIdAndUpdate(payrollId, {
      totalStaff: stats[0].totalStaff,
      totalHours: stats[0].totalHours,
      totalAmount: stats[0].totalAmount,
      totalBonus: stats[0].totalBonus,
      totalDeduction: stats[0].totalDeduction,
    });
  }
};

/**
 * Lấy thống kê payroll
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Thống kê
 */
export const getPayrollStats = async (query = {}) => {
  const filter = {};

  if (query.canteenId) {
    filter.canteenId = new mongoose.Types.ObjectId(query.canteenId);
  }
  if (query.periodStart) {
    filter.periodStart = { $gte: new Date(query.periodStart) };
  }
  if (query.periodEnd) {
    filter.periodEnd = { $lte: new Date(query.periodEnd) };
  }

  const stats = await Payroll.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        totalStaff: { $sum: "$totalStaff" },
        totalHours: { $sum: "$totalHours" },
      },
    },
  ]);

  return stats;
};
