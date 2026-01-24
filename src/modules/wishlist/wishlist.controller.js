import catchAsync from "../../utils/catchAsync.js";
import * as wishlistService from "./wishlist.service.js";

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private
 */
export const getMyWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlistByUser(req.user._id);
  res.status(200).json({
    status: "success",
    data: { wishlist },
  });
});

/**
 * Add product to wishlist
 * @route POST /api/wishlist
 * @access Private
 */
export const addToWishlist = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.addToWishlist(req.user._id, productId);
  res.status(200).json({
    status: "success",
    message: "Product added to wishlist",
    data: { wishlist },
  });
});

/**
 * Remove product from wishlist
 * @route DELETE /api/wishlist/:productId
 * @access Private
 */
export const removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.removeFromWishlist(
    req.user._id,
    req.params.productId,
  );
  res.status(200).json({
    status: "success",
    message: "Product removed from wishlist",
    data: { wishlist },
  });
});

/**
 * Clear all items from wishlist
 * @route DELETE /api/wishlist
 * @access Private
 */
export const clearWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.clearWishlist(req.user._id);
  res.status(200).json({
    status: "success",
    message: "Wishlist cleared",
    data: { wishlist },
  });
});

/**
 * Check if product is in wishlist
 * @route GET /api/wishlist/check/:productId
 * @access Private
 */
export const checkInWishlist = catchAsync(async (req, res) => {
  const isInWishlist = await wishlistService.isInWishlist(
    req.user._id,
    req.params.productId,
  );
  res.status(200).json({
    status: "success",
    data: { isInWishlist },
  });
});

/**
 * Get wishlist count
 * @route GET /api/wishlist/count
 * @access Private
 */
export const getWishlistCount = catchAsync(async (req, res) => {
  const count = await wishlistService.getWishlistCount(req.user._id);
  res.status(200).json({
    status: "success",
    data: count,
  });
});

/**
 * Toggle product in wishlist (add if not exists, remove if exists)
 * @route POST /api/wishlist/toggle
 * @access Private
 */
export const toggleWishlist = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const result = await wishlistService.toggleWishlist(req.user._id, productId);
  res.status(200).json({
    status: "success",
    message: `Product ${result.action} ${result.action === "added" ? "to" : "from"} wishlist`,
    data: {
      action: result.action,
      wishlist: result.wishlist,
    },
  });
});
