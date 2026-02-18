import ProductCategory from "./productCategory.model.js";
import AppError from "../../utils/AppError.js";
import { paginatedQuery } from "../../utils/queryHelper.js";

/**
 * Create a new product category
 */
export const createProductCategory = async (data) => {
  // Kiểm tra xem tên category đã tồn tại trong canteen chưa
  const existingCategory = await ProductCategory.findOne({
    canteenId: data.canteenId,
    name: { $regex: new RegExp(`^${data.name}$`, "i") }, // Kiểm tra không phân biệt hoa thường
  });

  if (existingCategory) {
    throw new AppError(
      `Danh mục sản phẩm "${data.name}" đã tồn tại trong canteen này`,
      400,
    );
  }

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
  // Nếu update name, kiểm tra xem tên mới đã tồn tại chưa
  if (updateData.name) {
    const currentCategory = await ProductCategory.findById(id);
    if (!currentCategory) {
      throw new AppError("Product category not found", 404);
    }

    const existingCategory = await ProductCategory.findOne({
      _id: { $ne: id }, // Loại trừ chính nó
      canteenId: currentCategory.canteenId,
      name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
    });

    if (existingCategory) {
      throw new AppError(
        `Danh mục sản phẩm "${updateData.name}" đã tồn tại trong canteen này`,
        400,
      );
    }
  }

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
