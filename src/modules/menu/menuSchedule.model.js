import mongoose from "mongoose";

const menuScheduleSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "enabled",
    },
  },
  { timestamps: true }
);


// Indexes
menuScheduleSchema.index({ canteenId: 1, startAt: 1, endAt: 1 }, { unique: false });
menuScheduleSchema.index({ menuId: 1 });
menuScheduleSchema.index({ status: 1 });

const MenuSchedule = mongoose.model("MenuSchedule", menuScheduleSchema);

export default MenuSchedule;
