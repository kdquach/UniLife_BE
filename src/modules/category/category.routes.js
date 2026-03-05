import express from 'express';
import * as categoryController from './category.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// ============ Product Category Routes ============
router.get('/product', categoryController.getAllProductCategories);
router.get('/product/:id', categoryController.getProductCategoryById);

// Protected routes
router.use(protect);
router.use(restrictTo('admin', 'staff'));

router.post(
  '/product',
  auditLogger('CREATE', 'ProductCategory', 'ProductCategory'),
  categoryController.createProductCategory
);
router.patch(
  '/product/:id',
  auditLogger('UPDATE', 'ProductCategory', 'ProductCategory'),
  categoryController.updateProductCategory
);
router.delete(
  '/product/:id',
  restrictTo('admin'),
  auditLogger('DELETE', 'ProductCategory', 'ProductCategory'),
  categoryController.deleteProductCategory
);

// ============ Ingredient Category Routes ============
router.get('/ingredient', categoryController.getAllIngredientCategories);
router.get('/ingredient/:id', categoryController.getIngredientCategoryById);
router.post(
  '/ingredient',
  auditLogger('CREATE', 'IngredientCategory', 'IngredientCategory'),
  categoryController.createIngredientCategory
);
router.patch(
  '/ingredient/:id',
  auditLogger('UPDATE', 'IngredientCategory', 'IngredientCategory'),
  categoryController.updateIngredientCategory
);
router.delete(
  '/ingredient/:id',
  restrictTo('admin'),
  auditLogger('DELETE', 'IngredientCategory', 'IngredientCategory'),
  categoryController.deleteIngredientCategory
);

export default router;
