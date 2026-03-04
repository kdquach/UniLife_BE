import express from 'express';
import * as ingredientController from './ingredient.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes
router.use(protect);
router.use(restrictTo('admin', 'staff', 'manager'));

// Ingredient routes
router
  .route('/')
  .get(ingredientController.getAllIngredients)
  .post(ingredientController.createIngredient);

router.get('/low-stock', ingredientController.getLowStockIngredients);

router
  .route('/:id')
  .get(ingredientController.getIngredientById)
  .patch(ingredientController.updateIngredient)
  .delete(restrictTo('admin', 'staff' ), ingredientController.deleteIngredient);

router.patch('/:id/stock', ingredientController.updateStock);

export default router;
