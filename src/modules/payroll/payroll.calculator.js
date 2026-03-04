import { StaffShift } from "../shift/staffShift.model.js";
import SalaryRate from "../salaryRate/salaryRate.model.js";
import mongoose from "mongoose";

/**
 * Lấy config thưởng/phạt của nhân viên từ SalaryRate
 * Nếu không có config riêng, dùng mặc định
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Config object
 */
const getUserConfig = async (userId) => {
  const salaryRate = await SalaryRate.findOne({ userId }).lean();

  // Trả về config (sử dụng giá trị từ DB hoặc default)
  return {
    attendanceBonus100: salaryRate?.attendanceBonus100 || 500000,
    attendanceBonus95: salaryRate?.attendanceBonus95 || 300000,
    attendanceBonus90: salaryRate?.attendanceBonus90 || 100000,
    overtimeMultiplier: salaryRate?.overtimeMultiplier || 1.5,
    lateDeduction: salaryRate?.lateDeduction || 50000,
    earlyLeaveDeduction: salaryRate?.earlyLeaveDeduction || 30000,
    absentDeduction: salaryRate?.absentDeduction || 200000,
    maxLateAllowed: salaryRate?.maxLateAllowed || 3,
  };
};

/**
 * Tính thưởng chuyên cần cho nhân viên
 * Điều kiện: Đi làm đủ số ca đã phân, không nghỉ không phép, không đi muộn quá 3 lần
 * @param {string} userId - User ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<{amount: number, reason: string}>}
 */
export const calculateAttendanceBonus = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
) => {
  try {
    // Lấy config của nhân viên
    const config = await getUserConfig(userId);

    // Lấy tất cả ca được phân công trong kỳ
    const assignedShifts = await StaffShift.find({
      staffId: userId,
      canteenId,
      date: { $gte: periodStart, $lte: periodEnd },
      status: { $ne: "cancelled" }, // Không tính ca đã hủy
    });

    if (assignedShifts.length === 0) {
      return { amount: 0, reason: "" };
    }

    // Đếm số ca làm việc thực tế (checked_out)
    const completedShifts = assignedShifts.filter(
      (s) => s.status === "checked_out",
    );

    // Đếm số lần đi muộn
    const lateCount = assignedShifts.filter(
      (s) =>
        s.attendanceStatus === "late" || s.attendanceStatus === "critical_late",
    ).length;

    // Đếm số ca nghỉ không phép
    const absentCount = assignedShifts.filter(
      (s) => s.status === "absent",
    ).length;

    // Tỷ lệ hoàn thành ca
    const completionRate = completedShifts.length / assignedShifts.length;

    // Kiểm tra điều kiện loại trừ
    let bonusAmount = 0;
    let reason = "";

    if (absentCount > 0) {
      reason = `Nghỉ không phép ${absentCount} ca`;
      return { amount: 0, reason };
    }

    if (lateCount > config.maxLateAllowed) {
      reason = `Đi muộn quá nhiều (${lateCount}/${config.maxLateAllowed} lần)`;
      return { amount: 0, reason };
    }

    // Tính thưởng dựa trên config
    if (completionRate === 1) {
      bonusAmount = config.attendanceBonus100;
      reason = "Thưởng chuyên cần 100%";
    } else if (completionRate >= 0.95) {
      bonusAmount = config.attendanceBonus95;
      reason = `Thưởng chuyên cần ${(completionRate * 100).toFixed(0)}%`;
    } else if (completionRate >= 0.9) {
      bonusAmount = config.attendanceBonus90;
      reason = `Thưởng chuyên cần ${(completionRate * 100).toFixed(0)}%`;
    }

    return { amount: bonusAmount, reason };
  } catch (error) {
    console.error("Error calculating attendance bonus:", error);
    return { amount: 0, reason: "" };
  }
};

/**
 * Tính phạt đi muộn
 * Quy tắc: Mỗi lần đi muộn bị phạt 50,000đ
 * @param {string} userId - User ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<{amount: number, reason: string}>}
 */
export const calculateLateDeduction = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
) => {
  try {
    const config = await getUserConfig(userId);

    const lateShifts = await StaffShift.find({
      staffId: userId,
      canteenId,
      date: { $gte: periodStart, $lte: periodEnd },
      $or: [
        { attendanceStatus: "late" },
        { attendanceStatus: "critical_late" },
      ],
    });

    if (lateShifts.length === 0) {
      return { amount: 0, reason: "" };
    }

    // Phạt theo config
    const deductionAmount = lateShifts.length * config.lateDeduction;
    const reason = `Phạt đi muộn ${lateShifts.length} lần`;

    // Chi tiết số phút đi muộn
    const totalLateMinutes = lateShifts.reduce(
      (sum, shift) => sum + (shift.lateMinutes || 0),
      0,
    );

    return {
      amount: deductionAmount,
      reason: `${reason} (tổng ${totalLateMinutes} phút)`,
    };
  } catch (error) {
    console.error("Error calculating late deduction:", error);
    return { amount: 0, reason: "" };
  }
};

/**
 * Tính thưởng overtime (làm thêm giờ)
 * Quy tắc: Overtime được duyệt x 1.5 lương giờ
 * @param {string} userId - User ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {string} canteenId - Canteen ID
 * @param {number} hourlyRate - Mức lương theo giờ
 * @returns {Promise<{amount: number, reason: string}>}
 */
export const calculateOvertimeBonus = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
  hourlyRate,
) => {
  try {
    const config = await getUserConfig(userId);

    // Lấy các ca có overtime được duyệt
    const overtimeShifts = await StaffShift.find({
      staffId: userId,
      canteenId,
      date: { $gte: periodStart, $lte: periodEnd },
      overtimeApproved: true,
      overtimeMinutes: { $gt: 0 },
    });

    if (overtimeShifts.length === 0) {
      return { amount: 0, reason: "" };
    }

    // Tổng số phút overtime
    const totalOvertimeMinutes = overtimeShifts.reduce(
      (sum, shift) => sum + (shift.overtimeMinutes || 0),
      0,
    );

    // Chuyển sang giờ
    const overtimeHours = totalOvertimeMinutes / 60;

    // Thưởng = overtime hours x hourlyRate x multiplier (từ config)
    const bonusAmount = Math.round(
      overtimeHours * hourlyRate * config.overtimeMultiplier,
    );

    const reason = `Thưởng overtime ${overtimeHours.toFixed(1)}h (x${config.overtimeMultiplier})`;

    return { amount: bonusAmount, reason };
  } catch (error) {
    console.error("Error calculating overtime bonus:", error);
    return { amount: 0, reason: "" };
  }
};

/**
 * Tính phạt về sớm
 * Quy tắc: Mỗi lần về sớm bị phạt 30,000đ
 * @param {string} userId - User ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<{amount: number, reason: string}>}
 */
export const calculateEarlyLeaveDeduction = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
) => {
  try {
    const config = await getUserConfig(userId);

    const earlyLeaveShifts = await StaffShift.find({
      staffId: userId,
      canteenId,
      date: { $gte: periodStart, $lte: periodEnd },
      attendanceStatus: "early_leave",
    });

    if (earlyLeaveShifts.length === 0) {
      return { amount: 0, reason: "" };
    }

    // Phạt theo config
    const deductionAmount =
      earlyLeaveShifts.length * config.earlyLeaveDeduction;
    const reason = `Phạt về sớm ${earlyLeaveShifts.length} lần`;

    return { amount: deductionAmount, reason };
  } catch (error) {
    console.error("Error calculating early leave deduction:", error);
    return { amount: 0, reason: "" };
  }
};

/**
 * Tính phạt nghỉ không phép
 * Quy tắc: Mỗi ca nghỉ không phép bị phạt 200,000đ
 * @param {string} userId - User ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<{amount: number, reason: string}>}
 */
export const calculateAbsentDeduction = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
) => {
  try {
    const config = await getUserConfig(userId);

    const absentShifts = await StaffShift.find({
      staffId: userId,
      canteenId,
      date: { $gte: periodStart, $lte: periodEnd },
      status: "absent",
    });

    if (absentShifts.length === 0) {
      return { amount: 0, reason: "" };
    }

    // Phạt theo config
    const deductionAmount = absentShifts.length * config.absentDeduction;
    const reason = `Phạt nghỉ không phép ${absentShifts.length} ca`;

    return { amount: deductionAmount, reason };
  } catch (error) {
    console.error("Error calculating absent deduction:", error);
    return { amount: 0, reason: "" };
  }
};

/**
 * Tính tổng các khoản điều chỉnh (bonus & deduction) cho một nhân viên
 * @param {string} userId - User ID
 * @param {Date} periodStart - Ngày bắt đầu kỳ
 * @param {Date} periodEnd - Ngày kết thúc kỳ
 * @param {string} canteenId - Canteen ID
 * @param {number} hourlyRate - Mức lương theo giờ
 * @returns {Promise<{bonus: number, deduction: number, bonusDetails: string, deductionDetails: string}>}
 */
export const calculateAdjustments = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
  hourlyRate,
) => {
  try {
    // Tính các khoản thưởng
    const [attendanceBonus, overtimeBonus] = await Promise.all([
      calculateAttendanceBonus(userId, periodStart, periodEnd, canteenId),
      calculateOvertimeBonus(
        userId,
        periodStart,
        periodEnd,
        canteenId,
        hourlyRate,
      ),
    ]);

    // Tính các khoản phạt
    const [lateDeduction, earlyLeaveDeduction, absentDeduction] =
      await Promise.all([
        calculateLateDeduction(userId, periodStart, periodEnd, canteenId),
        calculateEarlyLeaveDeduction(userId, periodStart, periodEnd, canteenId),
        calculateAbsentDeduction(userId, periodStart, periodEnd, canteenId),
      ]);

    // Tổng hợp
    const totalBonus = attendanceBonus.amount + overtimeBonus.amount;
    const totalDeduction =
      lateDeduction.amount +
      earlyLeaveDeduction.amount +
      absentDeduction.amount;

    // Tạo chi tiết lý do
    const bonusReasons = [attendanceBonus, overtimeBonus]
      .filter((b) => b.amount > 0)
      .map((b) => b.reason)
      .join("; ");

    const deductionReasons = [
      lateDeduction,
      earlyLeaveDeduction,
      absentDeduction,
    ]
      .filter((d) => d.amount > 0)
      .map((d) => d.reason)
      .join("; ");

    return {
      bonus: totalBonus,
      deduction: totalDeduction,
      bonusDetails: bonusReasons || "Không có khoản thưởng",
      deductionDetails: deductionReasons || "Không có khoản khấu trừ",
    };
  } catch (error) {
    console.error("Error calculating adjustments:", error);
    return {
      bonus: 0,
      deduction: 0,
      bonusDetails: "",
      deductionDetails: "",
    };
  }
};
