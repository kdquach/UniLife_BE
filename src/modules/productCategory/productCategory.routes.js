import express from "express";
import * as productCategoryController from "./productCategory.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", productCategoryController.getAllProductCategories);
router.get("/active", productCategoryController.getActiveProductCategories);
router.get("/:id", productCategoryController.getProductCategoryById);

// Protected routes - Admin, Manager, Staff
router.use(protect);
router.use(restrictTo("admin", "manager", "staff"));

router.post("/", productCategoryController.createProductCategory);
router.patch("/:id", productCategoryController.updateProductCategory);

// Admin only
router.delete(
  "/:id",
  restrictTo("admin"),
  productCategoryController.deleteProductCategory,
);

export default router;
