import catchAsync from "../../utils/catchAsync.js";
import * as wishlistService from "./wishlist.service.js";

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private
 */
export const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlistByUser(req.user._id);
  res.status(200).json({
    status: "success",
    data: { wishlist },
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

