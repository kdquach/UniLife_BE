import mongoose from "mongoose";

// Bảng SalaryRate - Quản lý mức lương theo giờ/ca cho nhân viên
const salaryRateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // Mỗi user chỉ có 1 mức lương hiện tại
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    // Mức lương theo giờ
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: [0, "Hourly rate cannot be negative"],
    },
    // Có hiệu lực từ ngày
    effectiveFrom: {
      type: Date,
      required: [true, "Effective date is required"],
      default: Date.now,
    },

    // ============ Cấu hình Thưởng ============
    // Thưởng chuyên cần (attendance bonus)
    attendanceBonus100: {
      type: Number,
      default: 500000,
      min: [0, "Attendance bonus cannot be negative"],
    },
    attendanceBonus95: {
      type: Number,
      default: 300000,
      min: [0, "Attendance bonus cannot be negative"],
    },
    attendanceBonus90: {
      type: Number,
      default: 100000,
      min: [0, "Attendance bonus cannot be negative"],
    },
    // Hệ số thưởng overtime (1.5 = 150%)
    overtimeMultiplier: {
      type: Number,
      default: 1.5,
      min: [1, "Overtime multiplier must be at least 1"],
    },

    // ============ Cấu hình Phạt ============
    // Phạt đi muộn (mỗi lần)
    lateDeduction: {
      type: Number,
      default: 50000,
      min: [0, "Late deduction cannot be negative"],
    },
    // Phạt về sớm (mỗi lần)
    earlyLeaveDeduction: {
      type: Number,
      default: 30000,
      min: [0, "Early leave deduction cannot be negative"],
    },
    // Phạt nghỉ không phép (mỗi ca)
    absentDeduction: {
      type: Number,
      default: 200000,
      min: [0, "Absent deduction cannot be negative"],
    },

    // ============ Ngưỡng điều kiện ============
    // Số lần đi muộn tối đa cho phép vẫn được thưởng chuyên cần
    maxLateAllowed: {
      type: Number,
      default: 3,
      min: [0, "Max late allowed cannot be negative"],
    },

    // Ghi chú
    note: {
      type: String,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    // Người cập nhật
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
salaryRateSchema.index({ userId: 1 });
salaryRateSchema.index({ canteenId: 1 });

const SalaryRate = mongoose.model("SalaryRate", salaryRateSchema);

export default SalaryRate;
