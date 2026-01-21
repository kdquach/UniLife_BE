import Product from "./product.model.js";
import AppError from "../../utils/AppError.js";

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
export const getAllProducts = async (query = {}) => {
  const filter = {};

  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  // Text search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const products = await Product.find(filter)
    .populate("canteenId", "name location")
    .sort({ createdAt: -1 });

  return products;
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product object
 */
export const getProductById = async (id) => {
  const product = await Product.findById(id).populate(
    "canteenId",
    "name location",
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

/**
 * Get products by canteen
 * @param {string} canteenId - Canteen ID
 * @returns {Promise<Array>} Array of products
 */
export const getProductsByCanteen = async (canteenId) => {
  const products = await Product.find({ canteenId, status: "available" }).sort({
    name: 1,
  });
  return products;
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
    throw new AppError("Product not found", 404);
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
    throw new AppError("Product not found", 404);
  }
};

/**
 * Add ingredient to product recipe
 * @param {string} productId - Product ID
 * @param {Object} ingredient - Ingredient data
 * @returns {Promise<Object>} Updated product
 */
export const addRecipeIngredient = async (productId, ingredient) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $push: { recipe: ingredient } },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

/**
 * Remove ingredient from product recipe
 * @param {string} productId - Product ID
 * @param {string} ingredientId - Ingredient ID to remove
 * @returns {Promise<Object>} Updated product
 */
export const removeRecipeIngredient = async (productId, ingredientId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $pull: { recipe: { ingredientId } } },
    { new: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};
