import express from 'express';
import * as productController from './product.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import {
  uploadFields,
  handleUploadError,
} from '../../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/canteen/:canteenId', productController.getProductsByCanteen);
router.get(
  '/canteen/:canteenId/search',
  productController.searchProductsByCanteen
);

// Admin routes for deleted products - must be before /:id
router.get(
  '/deleted',
  protect,
  restrictTo('admin'),
  productController.getDeletedProducts
);

// Inventory routes - must be before /:id
router.get('/inventory/out-of-stock', productController.getOutOfStockProducts);
router.get('/inventory/low-stock', productController.getLowStockProducts);
router.get('/:id/inventory-check', productController.getProductInventoryCheck);
router.get('/:id/inventory', productController.getProductInventory);

// Get by ID - must be after specific routes
router.get('/:id', productController.getProductById);

// Protected routes
router.use(protect);
router.use(restrictTo('staff', 'admin'));

router.post(
  '/',
  uploadFields(
    [
      { name: 'image', maxCount: 1 },
      { name: 'images', maxCount: 5 },
    ],
    'product'
  ),
  handleUploadError,
  productController.createProduct
);
router.patch(
  '/:id',
  uploadFields(
    [
      { name: 'image', maxCount: 1 },
      { name: 'images', maxCount: 5 },
    ],
    'product'
  ),
  handleUploadError,
  productController.updateProduct
);

// Recipe management
router.post('/:id/recipe', productController.addRecipeIngredient);
router.delete(
  '/:id/recipe/:ingredientId',
  productController.removeRecipeIngredient
);

// Admin only
router.patch(
  '/:id/restore',
  restrictTo('admin'),
  productController.restoreProduct
);
router.delete('/:id', restrictTo('admin'), productController.deleteProduct);

export default router;
