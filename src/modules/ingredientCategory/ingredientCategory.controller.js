import catchAsync from "../../utils/catchAsync.js";
import * as ingredientCategoryService from "./ingredientCategory.service.js";
import { formatPaginatedResponse } from "../../utils/queryHelper.js";
import AppError from "../../utils/AppError.js";

/**
 * Create ingredient category
 * @route POST /api/ingredient-categories
 * @access Private (Admin, Manager)
 */
export const createIngredientCategory = catchAsync(async (req, res) => {
  // Lấy canteenId từ user đang đăng nhập
  const canteenId = req.user.canteenId;

  if (!canteenId) {
    throw new AppError("User không được gán vào canteen nào", 400);
  }

  const category = await ingredientCategoryService.createIngredientCategory({
    ...req.body,
    canteenId,
  });

  res.status(201).json({
    success: true,
    message: "Tạo nhóm nguyên liệu thành công",
    data: category,
  });
});

/**
 * Get all ingredient categories với phân trang
 * @route GET /api/ingredient-categories
 * @access Public
 */
export const getAllIngredientCategories = catchAsync(async (req, res) => {
  const result = await ingredientCategoryService.getAllIngredientCategories(
    req.query,
  );

  res
    .status(200)
    .json(
      formatPaginatedResponse(
        result,
        "Lấy danh sách danh mục nguyên liệu thành công",
      ),
    );
});

/**
 * Get active ingredient categories only
 * @route GET /api/ingredient-categories/active
 * @access Public
 */
export const getActiveIngredientCategories = catchAsync(async (req, res) => {
  const categories =
    await ingredientCategoryService.getActiveIngredientCategories();

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

/**
 * Get ingredient category by ID
 * @route GET /api/ingredient-categories/:id
 * @access Public
 */
export const getIngredientCategoryById = catchAsync(async (req, res) => {
  const category = await ingredientCategoryService.getIngredientCategoryById(
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: "Lấy chi tiết nhóm nguyên liệu thành công",
    data: category,
  });
});

/**
 * Update ingredient category
 * @route PATCH /api/ingredient-categories/:id
 * @access Private (Admin, Manager)
 */
export const updateIngredientCategory = catchAsync(async (req, res) => {
  const category = await ingredientCategoryService.updateIngredientCategory(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Cập nhật nhóm nguyên liệu thành công",
    data: category,
  });
});

/**
 * Delete ingredient category
 * @route DELETE /api/ingredient-categories/:id
 * @access Private (Admin)
 */
export const deleteIngredientCategory = catchAsync(async (req, res) => {
  await ingredientCategoryService.deleteIngredientCategory(req.params.id);

  res.status(200).json({
    success: true,
    message: "Xóa nhóm nguyên liệu thành công",
    data: null,
  });
});
