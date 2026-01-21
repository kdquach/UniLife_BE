import catchAsync from "../../utils/catchAsync.js";
import * as productService from "./product.service.js";

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (Staff, Admin)
 */
export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    status: "success",
    data: {
      product,
    },
  });
});

/**
 * Get all products
 * @route GET /api/products
 * @access Public
 */
export const getAllProducts = catchAsync(async (req, res) => {
  const products = await productService.getAllProducts(req.query);

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public
 */
export const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

/**
 * Get products by canteen
 * @route GET /api/products/canteen/:canteenId
 * @access Public
 */
export const getProductsByCanteen = catchAsync(async (req, res) => {
  const products = await productService.getProductsByCanteen(
    req.params.canteenId,
  );

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

/**
 * Update product
 * @route PATCH /api/products/:id
 * @access Private (Staff, Admin)
 */
export const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 */
export const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Add ingredient to recipe
 * @route POST /api/products/:id/recipe
 * @access Private (Staff, Admin)
 */
export const addRecipeIngredient = catchAsync(async (req, res) => {
  const product = await productService.addRecipeIngredient(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

/**
 * Remove ingredient from recipe
 * @route DELETE /api/products/:id/recipe/:ingredientId
 * @access Private (Staff, Admin)
 */
export const removeRecipeIngredient = catchAsync(async (req, res) => {
  const product = await productService.removeRecipeIngredient(
    req.params.id,
    req.params.ingredientId,
  );

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});
