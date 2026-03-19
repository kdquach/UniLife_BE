import express from 'express';
import * as productController from './product.controller.js';
import {
  protect,
  restrictTo,
  optionalProtect,
  requirePermission,
} from '../../middlewares/auth.middleware.js';
import {
  uploadFields,
  handleUploadError,
} from '../../middlewares/upload.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

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
  requirePermission('PRODUCT_READ'),
  productController.getAllProducts
);

// Admin/Manager routes for deleted products - must be before /:id
router.get(
  '/deleted',
  protect,
  restrictTo('staff', 'manager', 'admin'),
  requirePermission('PRODUCT_READ'),
  productController.getDeletedProducts
);

// Inventory routes - must be before /:id (chỉ staff/manager)
router.get(
  '/inventory/out-of-stock',
  protect,
  restrictTo('staff', 'manager'),
  requirePermission('PRODUCT_READ'),
  productController.getOutOfStockProducts
);
router.get(
  '/inventory/low-stock',
  protect,
  restrictTo('staff', 'manager'),
  requirePermission('PRODUCT_READ'),
  productController.getLowStockProducts
);

// Public route kiểm tra tồn kho
router.get('/:id/inventory-check', productController.getProductInventoryCheck);

// Protected route xem chi tiết inventory
router.get(
  '/:id/inventory',
  protect,
  restrictTo('staff', 'manager'),
  requirePermission('PRODUCT_READ'),
  productController.getProductInventory
);

// Get by ID - public route
router.get('/:id', optionalProtect, productController.getProductById);

// Protected routes - Staff và Manager only (Admin KHÔNG có quyền CRUD)
router.use(protect);
router.use(restrictTo('staff', 'manager'));

router.post(
  '/',
  requirePermission('PRODUCT_CREATE'),
  auditLogger('CREATE', 'Product', 'Product'),
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
  requirePermission('PRODUCT_UPDATE'),
  auditLogger('UPDATE', 'Product', 'Product'),
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

// Restore và delete (cho cả staff/manager/admin)
router.patch(
  '/:id/restore',
  requirePermission('PRODUCT_UPDATE'),
  auditLogger('UPDATE', 'Product', 'Product'),
  productController.restoreProduct
);
router.delete(
  '/:id',
  requirePermission('PRODUCT_DELETE'),
  auditLogger('DELETE', 'Product', 'Product'),
  productController.deleteProduct
);

export default router;
