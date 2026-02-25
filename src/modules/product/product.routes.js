import express from 'express';
import * as productController from './product.controller.js';
import {
  protect,
  restrictTo,
  optionalProtect,
} from '../../middlewares/auth.middleware.js';
import {
  uploadFields,
  handleUploadError,
} from '../../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes - Customer xem sản phẩm (có optionalProtect để lọc nếu staff/manager đăng nhập)
router.get('/', optionalProtect, productController.getAllProducts);
router.get(
  '/canteen/:canteenId',
  optionalProtect,
  productController.getProductsByCanteen
);
router.get(
  '/canteen/:canteenId/search',
  optionalProtect,
  productController.searchProductsByCanteen
);

// Protected routes cho Staff/Manager quản lý sản phẩm
router.get(
  '/manage',
  protect,
  restrictTo('staff', 'manager'),
  productController.getAllProducts
);

// Admin/Manager routes for deleted products - must be before /:id
router.get(
  '/deleted',
  protect,
  restrictTo('staff', 'manager', 'admin'),
  productController.getDeletedProducts
);

// Inventory routes - must be before /:id (chỉ staff/manager)
router.get(
  '/inventory/out-of-stock',
  protect,
  restrictTo('staff', 'manager'),
  productController.getOutOfStockProducts
);
router.get(
  '/inventory/low-stock',
  protect,
  restrictTo('staff', 'manager'),
  productController.getLowStockProducts
);

// Public route kiểm tra tồn kho
router.get('/:id/inventory-check', productController.getProductInventoryCheck);

// Protected route xem chi tiết inventory
router.get(
  '/:id/inventory',
  protect,
  restrictTo('staff', 'manager'),
  productController.getProductInventory
);

// Get by ID - public route
router.get('/:id', optionalProtect, productController.getProductById);

// Protected routes - Staff và Manager only (Admin KHÔNG có quyền CRUD)
router.use(protect);
router.use(restrictTo('staff', 'manager'));

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

// Restore và delete (cho cả staff/manager/admin)
router.patch('/:id/restore', productController.restoreProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
