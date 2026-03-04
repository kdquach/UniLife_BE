import mongoose from "mongoose";

// Bảng Payroll - Đại diện cho một kỳ lương (Master/Header)
const payrollSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
    },
    // Mô tả kỳ lương: "Lương tháng 03/2026"
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    // Tổng số nhân viên trong kỳ này
    totalStaff: {
      type: Number,
      default: 0,
      min: [0, "Total staff cannot be negative"],
    },
    // Tổng giờ làm của tất cả nhân viên
    totalHours: {
      type: Number,
      default: 0,
      min: [0, "Total hours cannot be negative"],
    },
    // Tổng lương phải trả
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },
    // Tổng thưởng
    totalBonus: {
      type: Number,
      default: 0,
    },
    // Tổng khấu trừ
    totalDeduction: {
      type: Number,
      default: 0,
    },
    // Trạng thái của kỳ lương
    status: {
      type: String,
      enum: [
        "draft", // Nháp - vừa tạo, chưa tính toán
        "calculated", // Đã tính toán xong
        "approved", // Đã được duyệt
        "paid", // Đã thanh toán
        "cancelled", // Đã hủy
      ],
      default: "draft",
    },
    // Mức lương theo giờ áp dụng cho kỳ này
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: [0, "Hourly rate cannot be negative"],
    },
    // Khóa kỳ lương - không cho sửa sau khi approved
    isLocked: {
      type: Boolean,
      default: false,
    },
    // Version để tracking thay đổi
    version: {
      type: Number,
      default: 1,
    },
    // Người tạo kỳ lương
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    // Người duyệt
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    // Người thanh toán
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paidAt: {
      type: Date,
    },
    // Ghi chú chung cho kỳ lương
    note: {
      type: String,
      maxlength: [1000, "Note cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
payrollSchema.index({ canteenId: 1, periodStart: 1, periodEnd: 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ periodStart: 1, periodEnd: 1 });
payrollSchema.index({ createdBy: 1 });

// Đảm bảo không tạo trùng kỳ lương cho cùng canteen
payrollSchema.index(
  { canteenId: 1, periodStart: 1, periodEnd: 1 },
  { unique: true },
);

// Validation: periodEnd phải sau periodStart
payrollSchema.pre("save", function (next) {
  if (this.periodEnd <= this.periodStart) {
    const error = new Error("Period end date must be after period start date");
    return next(error);
  }
  next();
});

// Tự động tính tổng khi save
payrollSchema.pre("save", function (next) {
  // totalAmount sẽ được tính từ các salary items
  // Có thể override trong service nếu cần
  next();
});

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
