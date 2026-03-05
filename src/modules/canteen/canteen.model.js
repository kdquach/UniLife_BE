import mongoose from "mongoose";

const canteenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Canteen name is required"],
      trim: true,
      maxlength: [100, "Canteen name cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Canteen location is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "maintenance"],
      default: "pending",
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: [true, "Canteen must belong to a Campus"],
      index: true, // Rất quan trọng để filter canteen theo vùng
    },
    // Danh sách các ngày nghỉ (off) dạng 'YYYY-MM-DD'
    offDates: {
      type: [String],
      default: [],
    },
    openingTime: {
      type: String,
      default: "07:00", // Format "HH:mm"
    },
    closingTime: {
      type: String,
      default: "21:00", // Format "HH:mm"
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
canteenSchema.index({ name: 1 });
canteenSchema.index({ status: 1 });
canteenSchema.index({ campusId: 1, status: 1 });

const Canteen = mongoose.model("Canteen", canteenSchema);

export default Canteen;
