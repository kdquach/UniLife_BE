import express from 'express';
import * as recipeController from './recipe.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Tat ca routes deu can authentication
router.use(protect);

// Recipe management tren Product.recipe
router.get(
  '/:productId/recipe',
  restrictTo('admin', 'staff', 'manager'),
  recipeController.getRecipeByProduct
);
router.get(
  '/:productId/recipe/:ingredientId',
  restrictTo('admin', 'staff', 'manager'),
  recipeController.getRecipeDetail
);

router.use(restrictTo('staff', 'manager'));

router.post(
  '/:productId/recipe',
  auditLogger('CREATE', 'Recipe', 'Recipe'),
  recipeController.addRecipeIngredient
);
router.patch(
  '/:productId/recipe/:ingredientId',
  auditLogger('UPDATE', 'Recipe', 'Recipe'),
  recipeController.updateRecipeIngredient
);
router.delete(
  '/:productId/recipe/:ingredientId',
  auditLogger('DELETE', 'Recipe', 'Recipe'),
  recipeController.removeRecipeIngredient
);

export default router;
