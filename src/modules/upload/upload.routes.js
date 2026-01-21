import express from "express";
import * as uploadController from "./upload.controller.js";
import * as uploadMiddleware from "../../middlewares/upload.middleware.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Avatar upload (any authenticated user can upload their avatar)
router.post(
  "/avatar",
  uploadMiddleware.uploadAvatar,
  uploadMiddleware.handleUploadError,
  uploadController.uploadAvatar,
);

// Banner upload (admin only)
router.post(
  "/banner",
  restrictTo("admin"),
  uploadMiddleware.uploadBanner,
  uploadMiddleware.handleUploadError,
  uploadController.uploadBanner,
);

// Product image upload (staff and admin)
router.post(
  "/product",
  restrictTo("admin", "staff", "manager"),
  uploadMiddleware.uploadProductImage,
  uploadMiddleware.handleUploadError,
  uploadController.uploadProductImage,
);

// Multiple product images upload
router.post(
  "/products",
  restrictTo("admin", "staff", "manager"),
  uploadMiddleware.uploadProductImages,
  uploadMiddleware.handleUploadError,
  uploadController.uploadProductImages,
);

// Canteen image upload (admin only)
router.post(
  "/canteen",
  restrictTo("admin"),
  uploadMiddleware.uploadCanteenImage,
  uploadMiddleware.handleUploadError,
  uploadController.uploadCanteenImage,
);

// Delete single image (admin only)
router.delete("/", restrictTo("admin"), uploadController.deleteImage);

// Delete multiple images (admin only)
router.delete(
  "/multiple",
  restrictTo("admin"),
  uploadController.deleteMultipleImages,
);

export default router;
