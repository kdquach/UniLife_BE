import express from 'express';
import * as productCategoryController from './productCategory.controller.js';
import {
  protect,
  requirePermission,
} from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Tất cả routes yêu cầu xác thực
router.use(protect);

// Routes đọc dữ liệu - Yêu cầu quyền PRODUCT_READ hoặc PRODUCT_CATEGORY_READ
router.get(
  '/',
  requirePermission('PRODUCT_READ', 'PRODUCT_CATEGORY_READ'),
  productCategoryController.getAllProductCategories
);

router.get(
  '/active',
  requirePermission('PRODUCT_READ', 'PRODUCT_CATEGORY_READ'),
  productCategoryController.getActiveProductCategories
);

router.get(
  '/:id',
  requirePermission('PRODUCT_READ', 'PRODUCT_CATEGORY_READ'),
  productCategoryController.getProductCategoryById
);

// Routes tạo mới - Yêu cầu quyền PRODUCT_CREATE hoặc PRODUCT_CATEGORY_CREATE
router.post(
  '/',
  requirePermission('PRODUCT_CREATE', 'PRODUCT_CATEGORY_CREATE'),
  auditLogger('CREATE', 'ProductCategory', 'ProductCategory'),
  productCategoryController.createProductCategory
);

// Routes cập nhật - Yêu cầu quyền PRODUCT_UPDATE hoặc PRODUCT_CATEGORY_UPDATE
router.patch(
  '/:id',
  requirePermission('PRODUCT_UPDATE', 'PRODUCT_CATEGORY_UPDATE'),
  auditLogger('UPDATE', 'ProductCategory', 'ProductCategory'),
  productCategoryController.updateProductCategory
);

// Routes xóa - Yêu cầu quyền PRODUCT_DELETE hoặc PRODUCT_CATEGORY_DELETE
router.delete(
  '/:id',
  requirePermission('PRODUCT_DELETE', 'PRODUCT_CATEGORY_DELETE'),
  auditLogger('DELETE', 'ProductCategory', 'ProductCategory'),
  productCategoryController.deleteProductCategory
);

export default router;
