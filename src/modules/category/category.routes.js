import express from "express";
import * as categoryController from "./category.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ============ Product Category Routes ============
router.get("/product", categoryController.getAllProductCategories);
router.get("/product/:id", categoryController.getProductCategoryById);

// Protected routes
router.use(protect);
router.use(restrictTo("admin", "staff"));

router.post("/product", categoryController.createProductCategory);
router.patch("/product/:id", categoryController.updateProductCategory);
router.delete(
  "/product/:id",
  restrictTo("admin"),
  categoryController.deleteProductCategory,
);

// ============ Ingredient Category Routes ============
router.get("/ingredient", categoryController.getAllIngredientCategories);
router.get("/ingredient/:id", categoryController.getIngredientCategoryById);
router.post("/ingredient", categoryController.createIngredientCategory);
router.patch("/ingredient/:id", categoryController.updateIngredientCategory);
router.delete(
  "/ingredient/:id",
  restrictTo("admin"),
  categoryController.deleteIngredientCategory,
);

export default router;
