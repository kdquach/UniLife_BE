import catchAsync from '../../utils/catchAsync.js';
import * as productService from './product.service.js';
import { formatPaginatedResponse } from '../../utils/queryHelper.js';
import Product from './product.model.js';

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (Staff, Admin)
 */
export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      product,
    },
  });
});

/**
 * Get all products with pagination
 * @route GET /api/products?page=1&limit=10&search=keyword&status=available&sort=-price
 * @access Public
 * @queryParams
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - search: Search in name, description, slug
 *   - status: Filter by status (available, out_of_stock, discontinued)
 *   - categoryId: Filter by category
 *   - canteenId: Filter by canteen
 *   - isPopular: Filter popular products (true/false)
 *   - isNew: Filter new products (true/false)
 *   - price[gte]: Minimum price
 *   - price[lte]: Maximum price
 *   - sort: Sort by fields (e.g., -price, name, createdAt)
 *   - fields: Select specific fields (e.g., name,price,image)
 */

export const getAllProducts = catchAsync(async (req, res) => {
  const result = await productService.getAllProducts(req.query);

  res
    .status(200)
    .json(formatPaginatedResponse(result, 'Lấy danh sách sản phẩm thành công'));
});

// export const getAllProducts = catchAsync(async (req, res) => {
//   const result = await paginatedQuery(Product, req.query, {
//     ...filterPresets.product,
//     populate: [
//       { path: "categoryId", select: "name" },
//       { path: "canteenId", select: "name location" },
//     ],
//   });

//   res
//     .status(200)
//     .json(formatPaginatedResponse(result, "Lấy danh sách sản phẩm thành công"));
// });

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public
 */
export const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

/**
 * Get products by canteen with pagination
 * @route GET /api/canteens/:canteenId/products?page=1&limit=10&status=available
 * @access Public
 */

export const getProductsByCanteen = catchAsync(async (req, res) => {
  const result = await productService.getProductsByCanteen(
    req.params.canteenId,
    req.query
  );

  res
    .status(200)
    .json(
      formatPaginatedResponse(
        result,
        'Lấy danh sách sản phẩm theo căng tin thành công'
      )
    );
});

// export const getProductsByCanteen = catchAsync(async (req, res) => {
//   const { canteenId } = req.params;

//   const result = await paginatedQuery(Product, req.query, {
//     ...filterPresets.product,
//     baseFilter: {
//       canteenId,
//       status: 'available',
//     },
//     populate: [{ path: 'categoryId', select: 'name' }],
//   });

//   res
//     .status(200)
//     .json(
//       formatPaginatedResponse(
//         result,
//         'Lấy danh sách sản phẩm theo căng tin thành công'
//       )
//     );
// });

/**
 * Update product
 * @route PATCH /api/products/:id
 * @access Private (Staff, Admin)
 */
export const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.status(200).json({
    status: 'success',
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

  res.status(204).send();
});

/**
 * Add ingredient to recipe
 * @route POST /api/products/:id/recipe
 * @access Private (Staff, Admin)
 */
export const addRecipeIngredient = catchAsync(async (req, res) => {
  const product = await productService.addRecipeIngredient(
    req.params.id,
    req.body
  );

  res.status(200).json({
    status: 'success',
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
    req.params.ingredientId
  );

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});
