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
export const getAllIngredientCategories = async (queryParams, canteenId) => {
  // Thêm filter canteenId nếu có
  const options = canteenId ? { baseFilter: { canteenId } } : {};
  return paginatedQuery(IngredientCategory, queryParams, options);
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
export const getIngredientCategoryById = async (id, canteenId) => {
  const filter = { _id: id };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const category = await IngredientCategory.findOne(filter);
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
  return category;
};

/**
 * Update ingredient category
 */
export const updateIngredientCategory = async (id, updateData, canteenId) => {
  // Kiểm tra category có tồn tại và thuộc canteen không
  const filter = { _id: id };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const currentCategory = await IngredientCategory.findOne(filter);
  if (!currentCategory) {
    throw new AppError("Ingredient category not found", 404);
  }

  // Nếu update name, kiểm tra xem tên mới đã tồn tại chưa
  if (updateData.name) {
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
export const deleteIngredientCategory = async (id, canteenId) => {
  const filter = { _id: id };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const category = await IngredientCategory.findOneAndDelete(filter);
  if (!category) {
    throw new AppError("Ingredient category not found", 404);
  }
  return category;
};

/**
 * Get active ingredient categories
 */
export const getActiveIngredientCategories = async (canteenId) => {
  const filter = { isActive: true };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const categories = await IngredientCategory.find(filter).sort({
    name: 1,
  });
  return categories;
};
