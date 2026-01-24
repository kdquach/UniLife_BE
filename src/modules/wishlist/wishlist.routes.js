import express from "express";
import * as wishlistController from "./wishlist.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user's wishlist
router.get("/", wishlistController.getMyWishlist);

// Get wishlist count
router.get("/count", wishlistController.getWishlistCount);

// Check if product is in wishlist
router.get("/check/:productId", wishlistController.checkInWishlist);

// Add product to wishlist
router.post("/", wishlistController.addToWishlist);

// Toggle product in wishlist (add/remove)
router.post("/toggle", wishlistController.toggleWishlist);

// Remove product from wishlist
router.delete("/:productId", wishlistController.removeFromWishlist);

// Clear wishlist
router.delete("/", wishlistController.clearWishlist);

export default router;
