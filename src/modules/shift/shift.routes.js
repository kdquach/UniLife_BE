import express from 'express';
import * as shiftController from './shift.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ============ Shift Routes ============
router.get(
  '/',
  restrictTo('staff', 'manager', 'admin'),
  shiftController.getAllShifts
);
router.get(
  '/:id',
  restrictTo('staff', 'manager', 'admin'),
  shiftController.getShiftById
);

// Admin only
router.post(
  '/',
  restrictTo('admin'),
  auditLogger('CREATE', 'Shift', 'Shift'),
  shiftController.createShift
);
router.patch(
  '/:id',
  restrictTo('admin'),
  auditLogger('UPDATE', 'Shift', 'Shift'),
  shiftController.updateShift
);
router.delete(
  '/:id',
  restrictTo('admin'),
  auditLogger('DELETE', 'Shift', 'Shift'),
  shiftController.deleteShift
);

export default router;
