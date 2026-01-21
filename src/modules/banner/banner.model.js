import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
    },
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

bannerSchema.index({ canteenId: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ order: 1 });

export const Banner = mongoose.model("Banner", bannerSchema);
