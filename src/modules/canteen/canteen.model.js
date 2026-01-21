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
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
canteenSchema.index({ name: 1 });
canteenSchema.index({ status: 1 });

const Canteen = mongoose.model("Canteen", canteenSchema);

export default Canteen;
