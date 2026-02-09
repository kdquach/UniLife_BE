import mongoose from "mongoose";

const productCategorySchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
productCategorySchema.index({ canteenId: 1, name: 1 }, { unique: true });
productCategorySchema.index({ canteenId: 1, isActive: 1 });
productCategorySchema.index({ isActive: 1 });

const ProductCategory = mongoose.model(
  "ProductCategory",
  productCategorySchema,
);

export default ProductCategory;
