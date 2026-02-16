import mongoose from "mongoose";

// Embedded menu item schema
const menuItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const menuSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    // Embedded menu items
    items: [menuItemSchema],
  },
  {
    timestamps: true,
  },
);

// Indexes
menuSchema.index({ canteenId: 1 });
menuSchema.index({ status: 1 });

const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
