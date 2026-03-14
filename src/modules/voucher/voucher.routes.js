import express from 'express';
import * as voucherController from './voucher.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Public routes
router.get('/active', voucherController.getActiveVouchers);
router.get('/code/:code', voucherController.getVoucherByCode);

// Protected routes (all authenticated users)
router.use(protect);

router.post('/validate', voucherController.validateVoucher);
router.get('/my-usage', voucherController.getMyVoucherUsage);

// Admin & Manager routes
router.use(restrictTo('admin', 'manager'));

router
  .route('/')
  .get(voucherController.getAllVouchers)
  .post(
    auditLogger('CREATE', 'Voucher', 'Voucher'),
    voucherController.createVoucher
  );

// Utility endpoints
router.get('/generate-code', voucherController.generateCode);
router.get('/export', voucherController.exportUsageReport);

router
  .route('/:id')
  .get(voucherController.getVoucherById)
  .patch(
    auditLogger('UPDATE', 'Voucher', 'Voucher'),
    voucherController.updateVoucher
  )
  .delete(
    auditLogger('DELETE', 'Voucher', 'Voucher'),
    voucherController.deleteVoucher
  );

// State management actions
router.post(
  '/:id/clone',
  auditLogger('CREATE', 'Voucher', 'Voucher'),
  voucherController.cloneVoucher
);
router.patch(
  '/:id/publish',
  auditLogger('UPDATE', 'Voucher', 'Voucher'),
  voucherController.publishVoucher
);
router.patch(
  '/:id/deactivate',
  auditLogger('UPDATE', 'Voucher', 'Voucher'),
  voucherController.deactivateVoucher
);
router.patch(
  '/:id/reactivate',
  auditLogger('UPDATE', 'Voucher', 'Voucher'),
  voucherController.reactivateVoucher
);
router.patch(
  '/:id/archive',
  auditLogger('UPDATE', 'Voucher', 'Voucher'),
  voucherController.archiveVoucher
);

// Usage history & stats
router.get('/:id/stats', voucherController.getVoucherUsageStats);
router.get('/:id/usage-history', voucherController.getVoucherUsageHistory);

export default router;
