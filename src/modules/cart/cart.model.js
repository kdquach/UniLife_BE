import mongoose from "mongoose";

// Cart Item Schema (embedded)
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
  },
  { timestamps: true },
);

// Cart Schema
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // One cart per user
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

cartSchema.index({ userId: 1 });

// Calculate total price
cartSchema.methods.calculateTotal = async function () {
  const Product = mongoose.model("Product");
  let total = 0;

  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  }

  this.totalPrice = total;
  return total;
};

export const Cart = mongoose.model("Cart", cartSchema);
