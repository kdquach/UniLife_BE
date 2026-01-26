import Product from './product.model.js';
import AppError from '../../utils/AppError.js';
import { paginatedQuery, filterPresets } from '../../utils/queryHelper.js';

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

/**
 * Get all products
 * @param {Object} query - Query parameters for filtering
 * @returns {Promise<Array>} Array of products
 */
export const getAllProducts = async (queryParams) => {
  return paginatedQuery(Product, queryParams, {
    ...filterPresets.product,
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'canteenId', select: 'name location' },
    ],
  });
};
// export const getAllProducts = async (query = {}) => {
//   const filter = {};

//   if (query.canteenId) {
//     filter.canteenId = query.canteenId;
//   }
//   if (query.categoryId) {
//     filter.categoryId = query.categoryId;
//   }
//   if (query.status) {
//     filter.status = query.status;
//   }

//   // Text search
//   if (query.search) {
//     filter.$text = { $search: query.search };
//   }

//   const products = await Product.find(filter)
//     .populate('canteenId', 'name location')
//     .sort({ createdAt: -1 });

//   return products;
// };

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product object
 */
export const getProductById = async (id) => {
  const product = await Product.findById(id).populate(
    'canteenId',
    'name location'
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

/**
 * Get products by canteen
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<Array>} Array of products
 */
export const getProductsByCanteen = async (canteenId, queryParams) => {
  return paginatedQuery(Product, queryParams, {
    ...filterPresets.product,
    baseFilter: {
      canteenId,
      status: 'available',
    },
    populate: [{ path: 'categoryId', select: 'name' }],
  });
};
// export const getProductsByCanteen = async (canteenId) => {
//   const products = await Product.find({ canteenId, status: 'available' }).sort({
//     name: 1,
//   });
//   return products;
// };
/**
 * Search products by canteen
 * @param {string} canteenId
 * @param {Object} queryParams
 */
export const searchProductsByCanteen = async (canteenId, queryParams) => {
  if (!canteenId) {
    throw new AppError('CanteenId is required to search products', 400);
  }

  const {
    sort,
    ...restQuery
  } = queryParams;

  // ✅ Map sort từ FE → Mongo
  const SORT_MAP = {
    'name-asc': 'name',
    'name-desc': '-name',
    'price-asc': 'price',
    'price-desc': '-price',
    default: '-createdAt',
  };

  const mappedSort = SORT_MAP[sort] || SORT_MAP.default;

  const options = {
    ...filterPresets.product,
    searchFields: ['name'],
    baseFilter: {
      canteenId,
      status: 'available',
    },
    sort: mappedSort,
    populate: [{ path: 'categoryId', select: 'name' }],
  };

  // ❌ không cho override searchFields
  const { searchFields, ...safeQueryParams } = restQuery;

  return paginatedQuery(Product, safeQueryParams, options);
};

/**
 * Update product
 * @param {string} id - Product ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (id, updateData) => {
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

/**
 * Delete product
 * @param {string} id - Product ID
 */
export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
};

/**
 * Add ingredient to product recipe
 * @param {string} productId - Product ID
 * @param {Object} ingredient - Ingredient data
 * @returns {Promise<Object>} Updated product
 */

export const addRecipeIngredient = async (productId, ingredient) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const exists = product.recipe.some(
    (item) => item.ingredientId.toString() === ingredient.ingredientId
  );

  if (exists) {
    throw new AppError('Ingredient already exists in recipe', 400);
  }

  product.recipe.push(ingredient);
  await product.save();

  return product;
};

// export const addRecipeIngredient = async (productId, ingredient) => {
//   const product = await Product.findByIdAndUpdate(
//     productId,
//     { $push: { recipe: ingredient } },
//     { new: true, runValidators: true }
//   );

//   if (!product) {
//     throw new AppError('Product not found', 404);
//   }

//   return product;
// };

/**
 * Remove ingredient from product recipe
 * @param {string} productId - Product ID
 * @param {string} ingredientId - Ingredient ID to remove
 * @returns {Promise<Object>} Updated product
 */
export const removeRecipeIngredient = async (productId, ingredientId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const before = product.recipe.length;

  product.recipe = product.recipe.filter(
    (item) => item.ingredientId.toString() !== ingredientId
  );

  if (product.recipe.length === before) {
    throw new AppError('Ingredient not found in recipe', 404);
  }

  await product.save();
  return product;
};

// export const removeRecipeIngredient = async (productId, ingredientId) => {
//   const product = await Product.findByIdAndUpdate(
//     productId,
//     { $pull: { recipe: { ingredientId } } },
//     { new: true }
//   );

//   if (!product) {
//     throw new AppError('Product not found', 404);
//   }

//   return product;
// };
