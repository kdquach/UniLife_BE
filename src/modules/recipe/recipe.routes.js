import express from 'express';
import * as recipeController from './recipe.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Tat ca routes deu can authentication
router.use(protect);
router.use(restrictTo('admin', 'staff', 'manager'));

// Recipe CRUD
router.post('/', recipeController.addRecipeIngredient);
router.post('/batch', recipeController.batchAddRecipeIngredients);
router.post('/clone', recipeController.cloneRecipe);

// Query routes
router.get('/product/:productId', recipeController.getRecipeByProduct);
router.get(
  '/product/:productId/check',
  recipeController.checkIngredientsAvailability
);
router.get(
  '/ingredient/:ingredientId/products',
  recipeController.getProductsByIngredient
);

// Update/Delete
router.patch('/:id', recipeController.updateRecipeIngredient);
router.delete('/:id', recipeController.removeRecipeIngredient);

export default router;
