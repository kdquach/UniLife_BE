import express from "express";
import * as ingredientCategoryController from "./ingredientCategory.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", ingredientCategoryController.getAllIngredientCategories);
router.get(
  "/active",
  ingredientCategoryController.getActiveIngredientCategories,
);
router.get("/:id", ingredientCategoryController.getIngredientCategoryById);

// Protected routes - Admin, Manager, Staff
router.use(protect);
router.use(restrictTo("admin", "manager", "staff"));

router.post("/", ingredientCategoryController.createIngredientCategory);
router.patch("/:id", ingredientCategoryController.updateIngredientCategory);

// Admin only
router.delete(
  "/:id",
  restrictTo("admin"),
  ingredientCategoryController.deleteIngredientCategory,
);

export default router;
