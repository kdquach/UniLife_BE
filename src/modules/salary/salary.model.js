import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    // Liên kết với bảng Payroll (kỳ lương)
    payrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: [true, "Payroll ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
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
    totalHours: {
      type: Number,
      default: 0,
      min: [0, "Total hours cannot be negative"],
    },
    baseSalary: {
      type: Number,
      required: [true, "Base salary is required"],
      min: [0, "Base salary cannot be negative"],
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, "Bonus cannot be negative"],
    },
    deduction: {
      type: Number,
      default: 0,
      min: [0, "Deduction cannot be negative"],
    },
    totalSalary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "calculated", "approved", "paid"],
      default: "pending",
    },
    calculatedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    note: {
      type: String,
      maxlength: [1000, "Note cannot exceed 1000 characters"],
    },
    // Lý do điều chỉnh lương (thưởng/khấu trừ)
    adjustmentReason: {
      type: String,
      maxlength: [500, "Adjustment reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
salarySchema.index({ payrollId: 1 });
salarySchema.index({ userId: 1, periodStart: 1, periodEnd: 1 });
salarySchema.index({ canteenId: 1 });
salarySchema.index({ status: 1 });
salarySchema.index({ periodStart: 1, periodEnd: 1 });

// Đảm bảo mỗi user chỉ có 1 salary record trong 1 payroll
salarySchema.index({ payrollId: 1, userId: 1 }, { unique: true });

// Calculate total salary before saving
salarySchema.pre("save", function (next) {
  this.totalSalary = this.baseSalary + this.bonus - this.deduction;
  next();
});

// Validation: periodEnd must be after periodStart
salarySchema.pre("save", function (next) {
  if (this.periodEnd <= this.periodStart) {
    const error = new Error("Period end date must be after period start date");
    return next(error);
  }
  next();
});

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
