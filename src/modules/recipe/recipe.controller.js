import catchAsync from '../../utils/catchAsync.js';
import * as recipeService from './recipe.service.js';

// ============ Recipe Controllers ============

// Lay cong thuc theo san pham
// GET /api/products/:productId/recipe
export const getRecipeByProduct = catchAsync(async (req, res) => {
  const recipe = await recipeService.getRecipeByProduct(
    req.params.productId,
    req.user
  );

  res.status(200).json({
    status: 'success',
    results: recipe.length,
    data: {
      recipe,
    },
  });
});

// Lay chi tiet nguyen lieu trong cong thuc
// GET /api/products/:productId/recipe/:ingredientId
export const getRecipeDetail = catchAsync(async (req, res) => {
  const recipeItem = await recipeService.getRecipeDetail(
    req.params.productId,
    req.params.ingredientId,
    req.user
  );

  res.status(200).json({
    status: 'success',
    data: {
      recipeItem,
    },
  });
});

// Them nguyen lieu vao cong thuc
// POST /api/products/:productId/recipe
export const addRecipeIngredient = catchAsync(async (req, res) => {
  const recipeItem = await recipeService.addRecipeIngredient(
    req.params.productId,
    req.body,
    req.user
  );

  res.status(201).json({
    status: 'success',
    data: {
      recipeItem,
    },
  });
});

// Cap nhat nguyen lieu trong cong thuc
// PATCH /api/products/:productId/recipe/:ingredientId
export const updateRecipeIngredient = catchAsync(async (req, res) => {
  const recipeItem = await recipeService.updateRecipeIngredient(
    req.params.productId,
    req.params.ingredientId,
    req.body,
    req.user
  );

  res.status(200).json({
    status: 'success',
    data: {
      recipeItem,
    },
  });
});

// Xoa nguyen lieu khoi cong thuc
// DELETE /api/products/:productId/recipe/:ingredientId
export const removeRecipeIngredient = catchAsync(async (req, res) => {
  const recipe = await recipeService.removeRecipeIngredient(
    req.params.productId,
    req.params.ingredientId,
    req.user
  );

  res.status(200).json({
    status: 'success',
    results: recipe.length,
    data: {
      recipe,
    },
  });
});
