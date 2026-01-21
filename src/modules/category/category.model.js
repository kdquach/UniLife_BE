import mongoose from "mongoose";

// Product Category Schema
const productCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

productCategorySchema.index({ name: 1 });

// Ingredient Category Schema
const ingredientCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

ingredientCategorySchema.index({ name: 1 });

export const ProductCategory = mongoose.model(
  "ProductCategory",
  productCategorySchema,
);
export const IngredientCategory = mongoose.model(
  "IngredientCategory",
  ingredientCategorySchema,
);
