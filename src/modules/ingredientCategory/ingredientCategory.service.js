import IngredientCategory from "./ingredientCategory.model.js";
import AppError from "../../utils/AppError.js";
import { paginatedQuery } from "../../utils/queryHelper.js";

/**
 * Create a new ingredient category
 */
export const createIngredientCategory = async (data) => {
  // Kiểm tra xem tên category đã tồn tại trong canteen chưa
  const existingCategory = await IngredientCategory.findOne({
    canteenId: data.canteenId,
    name: { $regex: new RegExp(`^${data.name}$`, "i") }, // Kiểm tra không phân biệt hoa thường
  });

  if (existingCategory) {
    throw new AppError(
      `Nhóm nguyên liệu "${data.name}" đã tồn tại trong canteen này`,
      400,
    );
  }

  const category = await IngredientCategory.create(data);
  return category;
};

/**
 * Get all ingredient categories với phân trang
 */
export const getAllIngredientCategories = async (queryParams) => {
  return paginatedQuery(IngredientCategory, queryParams);
};

/**
 * Get all ingredient categories không phân trang (để tương thích code cũ)
 */
export const getAllIngredientCategoriesNoPagination = async (filter = {}) => {
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
  // Nếu update name, kiểm tra xem tên mới đã tồn tại chưa
  if (updateData.name) {
    const currentCategory = await IngredientCategory.findById(id);
    if (!currentCategory) {
      throw new AppError("Ingredient category not found", 404);
    }

    const existingCategory = await IngredientCategory.findOne({
      _id: { $ne: id }, // Loại trừ chính nó
      canteenId: currentCategory.canteenId,
      name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
    });

    if (existingCategory) {
      throw new AppError(
        `Nhóm nguyên liệu "${updateData.name}" đã tồn tại trong canteen này`,
        400,
      );
    }
  }

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
