import IngredientCategory from "./ingredientCategory.model.js";
import AppError from "../../utils/AppError.js";

/**
 * Create a new ingredient category
 */
export const createIngredientCategory = async (data) => {
  const category = await IngredientCategory.create(data);
  return category;
};

/**
 * Get all ingredient categories
 */
export const getAllIngredientCategories = async (filter = {}) => {
  const categories = await IngredientCategory.find(filter).sort({ name: 1 });
  return categories;
};

/**
 * Get ingredient category by ID
 */
export const getIngredientCategoryById = async (id) => {
  const category = await IngredientCategory.findById(id);
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
  return category;
};

/**
 * Update ingredient category
 */
export const updateIngredientCategory = async (id, updateData) => {
  const category = await IngredientCategory.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
  return category;
};

/**
 * Delete ingredient category
 */
export const deleteIngredientCategory = async (id) => {
  const category = await IngredientCategory.findByIdAndDelete(id);
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
  return category;
};

/**
 * Get active ingredient categories
 */
export const getActiveIngredientCategories = async () => {
  const categories = await IngredientCategory.find({ isActive: true }).sort({
    name: 1,
  });
  return categories;
};
