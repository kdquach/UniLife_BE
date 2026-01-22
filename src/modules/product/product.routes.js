import express from "express";
import * as productController from "./product.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", productController.getAllProducts);
router.get("/canteen/:canteenId", productController.getProductsByCanteen);
router.get("/:id", productController.getProductById);

// Protected routes
router.use(protect);
router.use(restrictTo("staff", "admin"));

router.post("/", productController.createProduct);
router.patch("/:id", productController.updateProduct);

// Recipe management
router.post("/:id/recipe", productController.addRecipeIngredient);
router.delete(
  "/:id/recipe/:ingredientId",
  productController.removeRecipeIngredient,
);

// Admin only
router.delete("/:id", restrictTo("admin"), productController.deleteProduct);

export default router;
