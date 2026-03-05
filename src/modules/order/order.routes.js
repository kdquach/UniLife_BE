import express from 'express';
import * as orderController from './order.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Customer routes
router.post(
  '/',
  restrictTo('customer', 'staff', 'admin'),
  auditLogger('CREATE', 'Order', 'Order'),
  orderController.createOrder
);

router.get('/my-orders', orderController.getMyOrders);
router.patch(
  '/:id/cancel',
  auditLogger('UPDATE', 'Order', 'Order'),
  orderController.cancelOrder
);
router.post(
  '/:id/re-order',
  auditLogger('CREATE', 'Order', 'Order'),
  orderController.reOrder
);

// Staff routes
router.get(
  '/qr/:code',
  restrictTo('staff', 'admin'),
  orderController.getOrderByQRCode
);
router.post(
  '/scan-complete',
  restrictTo('staff', 'admin'),
  auditLogger('UPDATE', 'Order', 'Order'),
  orderController.scanAndComplete
);
router.post(
  '/manual-complete',
  restrictTo('staff', 'admin'),
  auditLogger('UPDATE', 'Order', 'Order'),
  orderController.manualComplete
);
router.patch(
  '/:id/status',
  restrictTo('staff', 'admin'),
  auditLogger('UPDATE', 'Order', 'Order'),
  orderController.updateOrderStatus
);
router.patch(
  '/:id/payment',
  restrictTo('staff', 'admin'),
  auditLogger('UPDATE', 'Order', 'Order'),
  orderController.updatePaymentStatus
);
router.patch(
  '/:id/complete',
  restrictTo('staff', 'admin'),
  auditLogger('UPDATE', 'Order', 'Order'),
  orderController.completeOrder
);

// Admin routes
router.get('/', restrictTo('staff', 'admin'), orderController.getAllOrders);
router.get('/stats', restrictTo('admin'), orderController.getOrderStats);

// Get single order (accessible by owner, staff, admin)
router.get('/:id', orderController.getOrderById);

export default router;
