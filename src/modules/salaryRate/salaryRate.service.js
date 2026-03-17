import SalaryRate from "./salaryRate.model.js";
import AppError from "../../utils/AppError.js";

/**
 * Thiết lập mức lương cho nhân viên
 * @param {Object} data - { userId, canteenId, hourlyRate, effectiveFrom, note, updatedBy }
 * @returns {Promise<Object>} SalaryRate
 */
export const setSalaryRate = async (data) => {
  // Kiểm tra xem đã có mức lương cho user này chưa
  let salaryRate = await SalaryRate.findOne({ userId: data.userId });

  if (salaryRate) {
    // Cập nhật toàn bộ cấu hình lương/thưởng/phạt nếu có gửi lên
    salaryRate.hourlyRate = data.hourlyRate ?? salaryRate.hourlyRate;
    salaryRate.effectiveFrom = data.effectiveFrom ?? salaryRate.effectiveFrom;

    salaryRate.attendanceBonus100 =
      data.attendanceBonus100 ?? salaryRate.attendanceBonus100;
    salaryRate.attendanceBonus95 =
      data.attendanceBonus95 ?? salaryRate.attendanceBonus95;
    salaryRate.attendanceBonus90 =
      data.attendanceBonus90 ?? salaryRate.attendanceBonus90;
    salaryRate.overtimeMultiplier =
      data.overtimeMultiplier ?? salaryRate.overtimeMultiplier;

    salaryRate.lateDeduction = data.lateDeduction ?? salaryRate.lateDeduction;
    salaryRate.earlyLeaveDeduction =
      data.earlyLeaveDeduction ?? salaryRate.earlyLeaveDeduction;
    salaryRate.absentDeduction =
      data.absentDeduction ?? salaryRate.absentDeduction;
    salaryRate.maxLateAllowed =
      data.maxLateAllowed ?? salaryRate.maxLateAllowed;

    salaryRate.note = data.note ?? salaryRate.note;
    salaryRate.updatedBy = data.updatedBy;
    await salaryRate.save();
  } else {
    // Tạo mới
    salaryRate = await SalaryRate.create(data);
  }

  return salaryRate;
};

/**
 * Lấy mức lương của một nhân viên
 * @param {string} userId - User ID
 * @returns {Promise<Object>} SalaryRate
 */
export const getSalaryRateByUser = async (userId) => {
  const salaryRate = await SalaryRate.findOne({ userId })
    .populate("userId", "fullName email")
    .populate("canteenId", "name")
    .populate("updatedBy", "fullName");

  if (!salaryRate) {
    throw new AppError("Chưa thiết lập mức lương cho nhân viên này", 404);
  }

  return salaryRate;
};

/**
 * Lấy danh sách mức lương theo canteen
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<Array>} Danh sách SalaryRate
 */
export const getSalaryRatesByCanteen = async (canteenId) => {
  const salaryRates = await SalaryRate.find({ canteenId })
    .populate("userId", "fullName email phone role")
    .populate("updatedBy", "fullName")
    .sort({ updatedAt: -1 });

  return salaryRates;
};

/**
 * Lấy tất cả mức lương
 * @returns {Promise<Array>} Danh sách SalaryRate
 */
export const getAllSalaryRates = async () => {
  const salaryRates = await SalaryRate.find()
    .populate("userId", "fullName email phone role")
    .populate("canteenId", "name")
    .populate("updatedBy", "fullName")
    .sort({ updatedAt: -1 });

  return salaryRates;
};

/**
 * Xóa mức lương
 * @param {string} userId - User ID
 */
export const deleteSalaryRate = async (userId) => {
  const salaryRate = await SalaryRate.findOneAndDelete({ userId });

  if (!salaryRate) {
    throw new AppError("Không tìm thấy mức lương", 404);
  }
};
