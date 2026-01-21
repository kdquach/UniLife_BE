import { ProductCategory, IngredientCategory } from "./category.model.js";
import AppError from "../../utils/AppError.js";

// ============ Product Category Services ============

export const createProductCategory = async (data) => {
  const category = await ProductCategory.create(data);
  return category;
};

export const getAllProductCategories = async () => {
  const categories = await ProductCategory.find().sort({ name: 1 });
  return categories;
};

export const getProductCategoryById = async (id) => {
  const category = await ProductCategory.findById(id);
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
  return category;
};

export const updateProductCategory = async (id, updateData) => {
  const category = await ProductCategory.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
  return category;
};

export const deleteProductCategory = async (id) => {
  const category = await ProductCategory.findByIdAndDelete(id);
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
};

// ============ Ingredient Category Services ============

export const createIngredientCategory = async (data) => {
  const category = await IngredientCategory.create(data);
  return category;
};

export const getAllIngredientCategories = async () => {
  const categories = await IngredientCategory.find().sort({ name: 1 });
  return categories;
};

export const getIngredientCategoryById = async (id) => {
  const category = await IngredientCategory.findById(id);
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
  return category;
};

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

export const deleteIngredientCategory = async (id) => {
  const category = await IngredientCategory.findByIdAndDelete(id);
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
};
