import express from "express";
import * as ingredientCategoryController from "./ingredientCategory.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";
import { auditLogger } from "../auditLog/auditLog.middleware.js";

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

router.post(
  "/",
  auditLogger("CREATE", "IngredientCategory", "IngredientCategory"),
  ingredientCategoryController.createIngredientCategory,
);
router.patch(
  "/:id",
  auditLogger("UPDATE", "IngredientCategory", "IngredientCategory"),
  ingredientCategoryController.updateIngredientCategory,
);

// Admin only
router.delete(
  "/:id",
  restrictTo("admin"),
  auditLogger("DELETE", "IngredientCategory", "IngredientCategory"),
  ingredientCategoryController.deleteIngredientCategory,
);

export default router;
