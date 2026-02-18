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
export const getAllProductCategories = async (queryParams, canteenId) => {
  // Thêm filter canteenId nếu có
  const options = canteenId ? { baseFilter: { canteenId } } : {};
  return paginatedQuery(ProductCategory, queryParams, options);
};

/**
 * Get product category by ID
 */
export const getProductCategoryById = async (id, canteenId) => {
  const filter = { _id: id };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const category = await ProductCategory.findOne(filter);
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
  return category;
};

/**
 * Update product category
 */
export const updateProductCategory = async (id, updateData, canteenId) => {
  // Kiểm tra category có tồn tại và thuộc canteen không
  const filter = { _id: id };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const currentCategory = await ProductCategory.findOne(filter);
  if (!currentCategory) {
    throw new AppError("Product category not found", 404);
  }

  // Nếu update name, kiểm tra xem tên mới đã tồn tại chưa
  if (updateData.name) {
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
export const deleteProductCategory = async (id, canteenId) => {
  const filter = { _id: id };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const category = await ProductCategory.findOneAndDelete(filter);
  if (!category) {
    throw new AppError("Product category not found", 404);
  }
  return category;
};

/**
 * Get active product categories
 */
export const getActiveProductCategories = async (canteenId) => {
  const filter = { isActive: true };
  if (canteenId) {
    filter.canteenId = canteenId;
  }

  const categories = await ProductCategory.find(filter).sort({
    name: 1,
  });
  return categories;
};
