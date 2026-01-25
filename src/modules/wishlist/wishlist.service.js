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

// /**
//  * Check if product is in wishlist
//  */
// export const isInWishlist = async (userId, productId) => {
//   const wishlist = await Wishlist.findOne({ userId });

//   if (!wishlist) {
//     return false;
//   }

//   return wishlist.hasProduct(productId);
// };