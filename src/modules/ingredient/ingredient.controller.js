import catchAsync from "../../utils/catchAsync.js";
import * as ingredientService from "./ingredient.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Ingredient } from "./ingredient.model.js";

// ============ Ingredient Controllers ============

export const createIngredient = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.createIngredient(req.body);
  res.status(201).json({ status: "success", data: { ingredient } });
});

export const getAllIngredients = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Ingredient, req.query, {
    ...filterPresets.ingredient,
    populate: [
      { path: "categoryId", select: "name" },
      { path: "canteenId", select: "name" },
    ],
  });
  res
    .status(200)
    .json(
      formatPaginatedResponse(result, "Lấy danh sách nguyên liệu thành công"),
    );
});

export const getIngredientById = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.getIngredientById(req.params.id);
  res.status(200).json({ status: "success", data: { ingredient } });
});

export const updateIngredient = catchAsync(async (req, res) => {
  const ingredient = await ingredientService.updateIngredient(
    req.params.id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { ingredient } });
});

export const deleteIngredient = catchAsync(async (req, res) => {
  await ingredientService.deleteIngredient(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

export const updateStock = catchAsync(async (req, res) => {
  const { quantity, operation } = req.body;
  const ingredient = await ingredientService.updateStock(
    req.params.id,
    quantity,
    operation,
  );
  res.status(200).json({ status: "success", data: { ingredient } });
});

export const getLowStockIngredients = catchAsync(async (req, res) => {
  const { canteenId, threshold = 10 } = req.query;
  const stockFilter = { stock: { $lte: Number(threshold) } };
  if (canteenId) stockFilter.canteenId = canteenId;

  const result = await paginatedQuery(Ingredient, req.query, {
    ...filterPresets.ingredient,
    baseFilter: stockFilter,
    populate: [
      { path: "categoryId", select: "name" },
      { path: "canteenId", select: "name" },
    ],
  });
  res
    .status(200)
    .json(
      formatPaginatedResponse(
        result,
        "Lấy danh sách nguyên liệu sắp hết thành công",
      ),
    );
});

// ============ Recipe Controllers ============

export const addRecipeIngredient = catchAsync(async (req, res) => {
  const { productId, ingredientId, quantity, description } = req.body;
  const recipe = await ingredientService.addRecipeIngredient(
    productId,
    ingredientId,
    quantity,
    description,
  );
  res.status(201).json({ status: "success", data: { recipe } });
});

export const getRecipeByProduct = catchAsync(async (req, res) => {
  const recipes = await ingredientService.getRecipeByProduct(
    req.params.productId,
  );
  res
    .status(200)
    .json({ status: "success", results: recipes.length, data: { recipes } });
});

export const updateRecipeIngredient = catchAsync(async (req, res) => {
  const recipe = await ingredientService.updateRecipeIngredient(
    req.params.id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { recipe } });
});

export const removeRecipeIngredient = catchAsync(async (req, res) => {
  await ingredientService.removeRecipeIngredient(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

export const getProductsByIngredient = catchAsync(async (req, res) => {
  const products = await ingredientService.getProductsByIngredient(
    req.params.ingredientId,
  );
  res
    .status(200)
    .json({ status: "success", results: products.length, data: { products } });
});
