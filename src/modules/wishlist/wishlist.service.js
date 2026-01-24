import { Wishlist } from "./wishlist.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/AppError.js";

/**
 * Get wishlist by user ID
 * Creates a new wishlist if one doesn't exist
 */
export const getWishlistByUser = async (userId) => {
  let wishlist = await Wishlist.findOne({ userId }).populate(
    "items.productId",
    "name price image status canteenId",
  );

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [] });
  }

  return wishlist;
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (userId, productId) => {
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    // Create new wishlist with the product
    wishlist = await Wishlist.create({
      userId,
      items: [{ productId }],
    });
  } else {
    // Check if product is already in wishlist
    const productExists = wishlist.hasProduct(productId);
    if (productExists) {
      throw new AppError("Product already in wishlist", 400);
    }

    // Add product to wishlist
    wishlist.items.push({ productId });
    await wishlist.save();
  }

  // Populate product details before returning
  await wishlist.populate(
    "items.productId",
    "name price image status canteenId",
  );

  return wishlist;
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    throw new AppError("Wishlist not found", 404);
  }

  // Find and remove the product
  const initialLength = wishlist.items.length;
  wishlist.items = wishlist.items.filter(
    (item) => item.productId.toString() !== productId,
  );

  if (wishlist.items.length === initialLength) {
    throw new AppError("Product not found in wishlist", 404);
  }

  await wishlist.save();

  // Populate product details before returning
  await wishlist.populate(
    "items.productId",
    "name price image status canteenId",
  );

  return wishlist;
};

/**
 * Clear all items from wishlist
 */
export const clearWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    throw new AppError("Wishlist not found", 404);
  }

  wishlist.items = [];
  await wishlist.save();

  return wishlist;
};

/**
 * Check if product is in wishlist
 */
export const isInWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    return false;
  }

  return wishlist.hasProduct(productId);
};

/**
 * Get wishlist count
 */
export const getWishlistCount = async (userId) => {
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    return { count: 0 };
  }

  return { count: wishlist.getCount() };
};

/**
 * Toggle product in wishlist (add if not exists, remove if exists)
 */
export const toggleWishlist = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      items: [{ productId }],
    });
    await wishlist.populate(
      "items.productId",
      "name price image status canteenId",
    );
    return { action: "added", wishlist };
  }

  const productExists = wishlist.hasProduct(productId);

  if (productExists) {
    // Remove from wishlist
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    await wishlist.save();
    await wishlist.populate(
      "items.productId",
      "name price image status canteenId",
    );
    return { action: "removed", wishlist };
  } else {
    // Add to wishlist
    wishlist.items.push({ productId });
    await wishlist.save();
    await wishlist.populate(
      "items.productId",
      "name price image status canteenId",
    );
    return { action: "added", wishlist };
  }
};
