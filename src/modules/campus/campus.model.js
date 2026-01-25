import mongoose from "mongoose";

const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campus name is required"], // VD: "FPT University HCMC"
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Campus code is required"], // VD: "HCM", "HN", "CT"
      unique: true,
      uppercase: true,
      trim: true,
      index: true, // Index để query nhanh
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Campus", campusSchema);