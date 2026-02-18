import catchAsync from "../../utils/catchAsync.js";
import * as productCategoryService from "./productCategory.service.js";
import { formatPaginatedResponse } from "../../utils/queryHelper.js";
import AppError from "../../utils/AppError.js";

/**
 * Create product category
 * @route POST /api/product-categories
 * @access Private (Admin, Manager)
 */
export const createProductCategory = catchAsync(async (req, res) => {
  // Lấy canteenId từ user đang đăng nhập
  const canteenId = req.user.canteenId;

  if (!canteenId) {
    throw new AppError("User không được gán vào canteen nào", 400);
  }

  const category = await productCategoryService.createProductCategory({
    ...req.body,
    canteenId,
  });

  res.status(201).json({
    success: true,
    message: "Tạo danh mục sản phẩm thành công",
    data: category,
  });
});

/**
 * Get all product categories
 * @route GET /api/product-categories
 * @access Public
 */
export const getAllProductCategories = catchAsync(async (req, res) => {
  // const filter = req.query.active === "true" ? { isActive: true } : {};
  // const categories =
  //   await productCategoryService.getAllProductCategories(filter);

  // res.status(200).json({
  //   status: "success",
  //   results: categories.length,
  //   data: { categories },
  // });

  const result = await productCategoryService.getAllProductCategories(
    req.query,
  );

  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy danh sách sản phẩm thành công"));
});

/**
 * Get active product categories only
 * @route GET /api/product-categories/active
 * @access Public
 */
export const getActiveProductCategories = catchAsync(async (req, res) => {
  const categories = await productCategoryService.getActiveProductCategories();

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

/**
 * Get product category by ID
 * @route GET /api/product-categories/:id
 * @access Public
 */
export const getProductCategoryById = catchAsync(async (req, res) => {
  const category = await productCategoryService.getProductCategoryById(
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: "Lấy chi tiết danh mục sản phẩm thành công",
    data: category,
  });
});

/**
 * Update product category
 * @route PATCH /api/product-categories/:id
 * @access Private (Admin, Manager)
 */
export const updateProductCategory = catchAsync(async (req, res) => {
  const category = await productCategoryService.updateProductCategory(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Cập nhật danh mục sản phẩm thành công",
    data: category,
  });
});

/**
 * Delete product category
 * @route DELETE /api/product-categories/:id
 * @access Private (Admin)
 */
export const deleteProductCategory = catchAsync(async (req, res) => {
  await productCategoryService.deleteProductCategory(req.params.id);

  res.status(200).json({
    success: true,
    message: "Xóa danh mục sản phẩm thành công",
    data: null,
  });
});
