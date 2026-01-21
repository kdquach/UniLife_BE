import mongoose from "mongoose";

// Ingredient Schema
const ingredientSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: [true, "Canteen ID is required"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IngredientCategory",
      required: [true, "Category ID is required"],
    },
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
      maxlength: [100, "Ingredient name cannot exceed 100 characters"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

ingredientSchema.index({ canteenId: 1, name: 1 });
ingredientSchema.index({ categoryId: 1 });

// Recipe Schema (Separate collection linking Product and Ingredient)
const recipeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: [true, "Ingredient ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  },
);

recipeSchema.index({ productId: 1, ingredientId: 1 }, { unique: true });

export const Ingredient = mongoose.model("Ingredient", ingredientSchema);
export const Recipe = mongoose.model("Recipe", recipeSchema);
