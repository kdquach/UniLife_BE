import ProductCategory from "./productCategory.model.js";
import AppError from "../../utils/AppError.js";
import { paginatedQuery } from "../../utils/queryHelper.js";

/**
 * Create a new product category
 */
export const createProductCategory = async (data) => {
  const category = await ProductCategory.create(data);
  return category;
};

/**
 * Get all product categories
 */
export const getAllProductCategories = async (queryParams) => {
  return paginatedQuery(ProductCategory, queryParams);
};

/**
 * Get product category by ID
 */
export const getProductCategoryById = async (id) => {
  const category = await ProductCategory.findById(id);
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
  return category;
};

/**
 * Update product category
 */
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

/**
 * Delete product category
 */
export const deleteProductCategory = async (id) => {
  const category = await ProductCategory.findByIdAndDelete(id);
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
  return category;
};

/**
 * Get active product categories
 */
export const getActiveProductCategories = async () => {
  const categories = await ProductCategory.find({ isActive: true }).sort({
    name: 1,
  });
  return categories;
};
