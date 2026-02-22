import Product from './product.model.js';
import AppError from '../../utils/AppError.js';
import { paginatedQuery, filterPresets } from '../../utils/queryHelper.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
} from './validation/product.validation.service.js';
import {
  buildProductImagePayload,
  deleteProductImagesByUrls,
  deleteProductImagesByPublicIds,
  getProductImageUrls,
} from './media/product.media.service.js';
import {
  getOutOfStockProducts,
  getLowStockProducts,
  getProductInventoryDetails,
  getProductInventoryCheck,
  deductProductInventory,
  restoreProductInventory,
} from './inventory/product.inventory.service.js';

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData, files) => {
  const validatedData = await validateCreateProduct(productData);
  const imagePayload = await buildProductImagePayload(files);

  if (imagePayload) {
    validatedData.image = imagePayload.image;
    validatedData.images = imagePayload.images;
  }

  try {
    const product = await Product.create(validatedData);
    return product;
  } catch (error) {
    if (imagePayload?.publicIds?.length) {
      await deleteProductImagesByPublicIds(imagePayload.publicIds);
    }
    throw error;
  }
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

  const { sort, ...restQuery } = queryParams;

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
export const updateProduct = async (id, updateData, files) => {
  const currentProduct = await Product.findById(id);
  if (!currentProduct) {
    throw new AppError('Product not found', 404);
  }

  const validatedData = await validateUpdateProduct(currentProduct, updateData);
  const imagePayload = await buildProductImagePayload(files);

  const oldImageUrls = imagePayload ? getProductImageUrls(currentProduct) : [];

  if (imagePayload) {
    validatedData.image = imagePayload.image;
    validatedData.images = imagePayload.images;
  }

  try {
    const product = await Product.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    });

    if (imagePayload && oldImageUrls.length > 0) {
      await deleteProductImagesByUrls(oldImageUrls);
    }

    return product;
  } catch (error) {
    if (imagePayload?.publicIds?.length) {
      await deleteProductImagesByPublicIds(imagePayload.publicIds);
    }
    throw error;
  }
};

/**
 * Delete product
 * @param {string} id - Product ID
 */
export const deleteProduct = async (id) => {
  const product = await Product.findOne({ _id: id }).setOptions({
    includeDeleted: true,
  });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.isDeleted) {
    throw new AppError('Sản phẩm đã bị xóa', 400);
  }

  product.isDeleted = true;
  product.deletedAt = new Date();
  await product.save();
};

/**
 * Lấy danh sách sản phẩm đã xóa (Admin)
 * @param {Object} queryParams - Tham số truy vấn
 * @returns {Promise<Object>} Danh sách sản phẩm đã xóa phân trang
 */
export const getDeletedProducts = async (queryParams) => {
  return paginatedQuery(Product, queryParams, {
    ...filterPresets.product,
    baseFilter: { isDeleted: true },
    mongooseOptions: { includeDeleted: true },
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'canteenId', select: 'name location' },
    ],
  });
};

/**
 * Khôi phục sản phẩm đã xóa (Admin)
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Sản phẩm sau khi khôi phục
 */
export const restoreProduct = async (id) => {
  const product = await Product.findOne({ _id: id }).setOptions({
    includeDeleted: true,
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.isDeleted) {
    throw new AppError('Sản phẩm chưa bị xóa', 400);
  }

  product.isDeleted = false;
  product.deletedAt = null;
  await product.save();

  return product;
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

/**
 * Inventory Management
 */

export const getOutOfStockListByCanteen = async (canteenId, options) => {
  return getOutOfStockProducts(canteenId, options);
};

export const getLowStockListByCanteen = async (canteenId, options) => {
  return getLowStockProducts(canteenId, options);
};

export const getInventoryDetailsForProduct = async (productId) => {
  return getProductInventoryDetails(productId);
};

export const getInventoryCheckForProduct = async (productId, quantity) => {
  return getProductInventoryCheck(productId, quantity);
};

export const deductInventory = async (productId, recipeItems) => {
  return deductProductInventory(productId, recipeItems);
};

export const restoreInventory = async (productId, recipeItems) => {
  return restoreProductInventory(productId, recipeItems);
};
