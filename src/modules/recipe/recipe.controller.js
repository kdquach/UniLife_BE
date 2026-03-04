import catchAsync from '../../utils/catchAsync.js';
import * as recipeService from './recipe.service.js';

// ============ Recipe Controllers ============

// Them nguyen lieu vao cong thuc
// POST /api/recipes
export const addRecipeIngredient = catchAsync(async (req, res) => {
  const recipe = await recipeService.addRecipeIngredient(req.body);

  res.status(201).json({
    success: true,
    message: 'Thêm nguyên liệu vào công thức thành công',
    data: recipe,
  });
});

// Lay cong thuc theo san pham
// GET /api/recipes/product/:productId
export const getRecipeByProduct = catchAsync(async (req, res) => {
  const recipes = await recipeService.getRecipeByProduct(req.params.productId);

  res.status(200).json({
    success: true,
    results: recipes.length,
    data: recipes,
  });
});

// Cap nhat nguyen lieu trong cong thuc
// PATCH /api/recipes/:id
export const updateRecipeIngredient = catchAsync(async (req, res) => {
  const recipe = await recipeService.updateRecipeIngredient(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Cập nhật công thức thành công',
    data: recipe,
  });
});

// Xoa nguyen lieu khoi cong thuc
// DELETE /api/recipes/:id
export const removeRecipeIngredient = catchAsync(async (req, res) => {
  await recipeService.removeRecipeIngredient(req.params.id);

  res.status(204).json({
    success: true,
    data: null,
  });
});

// Lay san pham su dung nguyen lieu
// GET /api/recipes/ingredient/:ingredientId/products
export const getProductsByIngredient = catchAsync(async (req, res) => {
  const products = await recipeService.getProductsByIngredient(
    req.params.ingredientId
  );

  res.status(200).json({
    success: true,
    results: products.length,
    data: products,
  });
});

// Kiem tra nguyen lieu co du khong
// GET /api/recipes/product/:productId/check?quantity=5
export const checkIngredientsAvailability = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.query;

  const result = await recipeService.checkIngredientsAvailability(
    productId,
    Number(quantity)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

// Batch them nhieu nguyen lieu
// POST /api/recipes/batch
export const batchAddRecipeIngredients = catchAsync(async (req, res) => {
  const { productId, ingredients } = req.body;

  const recipes = await recipeService.batchAddRecipeIngredients(
    productId,
    ingredients
  );

  res.status(201).json({
    success: true,
    message: 'Thêm nhiều nguyên liệu thành công',
    data: recipes,
  });
});

// Sao chep cong thuc
// POST /api/recipes/clone
export const cloneRecipe = catchAsync(async (req, res) => {
  const { fromProductId, toProductId } = req.body;

  const recipes = await recipeService.cloneRecipe(fromProductId, toProductId);

  res.status(201).json({
    success: true,
    message: 'Sao chép công thức thành công',
    data: recipes,
  });
});
