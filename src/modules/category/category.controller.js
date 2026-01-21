import catchAsync from "../../utils/catchAsync.js";
import * as categoryService from "./category.service.js";

// ============ Product Category Controllers ============

export const createProductCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createProductCategory(req.body);
  res.status(201).json({ status: "success", data: { category } });
});

export const getAllProductCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getAllProductCategories();
  res
    .status(200)
    .json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
});

export const getProductCategoryById = catchAsync(async (req, res) => {
  const category = await categoryService.getProductCategoryById(req.params.id);
  res.status(200).json({ status: "success", data: { category } });
});

export const updateProductCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateProductCategory(
    req.params.id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { category } });
});

export const deleteProductCategory = catchAsync(async (req, res) => {
  await categoryService.deleteProductCategory(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

// ============ Ingredient Category Controllers ============

export const createIngredientCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createIngredientCategory(req.body);
  res.status(201).json({ status: "success", data: { category } });
});

export const getAllIngredientCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getAllIngredientCategories();
  res
    .status(200)
    .json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
});

export const getIngredientCategoryById = catchAsync(async (req, res) => {
  const category = await categoryService.getIngredientCategoryById(
    req.params.id,
  );
  res.status(200).json({ status: "success", data: { category } });
});

export const updateIngredientCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateIngredientCategory(
    req.params.id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { category } });
});

export const deleteIngredientCategory = catchAsync(async (req, res) => {
  await categoryService.deleteIngredientCategory(req.params.id);
  res.status(204).json({ status: "success", data: null });
});
