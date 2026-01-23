import mongoose from "mongoose";

const ingredientCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ingredient category name is required"],
      trim: true,
      unique: true,
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
ingredientCategorySchema.index({ name: 1 });
ingredientCategorySchema.index({ isActive: 1 });

const IngredientCategory = mongoose.model(
  "IngredientCategory",
  ingredientCategorySchema,
);

export default IngredientCategory;
