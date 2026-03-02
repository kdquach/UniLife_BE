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
