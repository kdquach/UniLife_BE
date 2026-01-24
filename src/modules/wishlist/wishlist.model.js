import mongoose from "mongoose";

// Wishlist Item Schema (embedded)
const wishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
  },
  { _id: true, timestamps: true },
);

// Wishlist Schema
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // One wishlist per user
    },
    items: [wishlistItemSchema],
  },
  {
    timestamps: true,
  },
);

wishlistSchema.index({ userId: 1 });

// Check if product is already in wishlist
wishlistSchema.methods.hasProduct = function (productId) {
  return this.items.some(
    (item) => item.productId.toString() === productId.toString(),
  );
};

// Get wishlist count
wishlistSchema.methods.getCount = function () {
  return this.items.length;
};

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export { Wishlist, wishlistSchema };
export default Wishlist;
