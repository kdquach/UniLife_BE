import express from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';
import {
  getMyShiftChangeRequests,
  getShiftChangeRequests,
  createShiftChangeRequest,
  reviewShiftChangeRequest,
} from './shiftChange.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', restrictTo('manager', 'admin'), getShiftChangeRequests);
router.get(
  '/my',
  restrictTo('staff', 'manager', 'admin'),
  getMyShiftChangeRequests
);
router.post(
  '/',
  restrictTo('staff', 'manager', 'admin'),
  auditLogger('CREATE', 'ShiftChange', 'ShiftChange'),
  createShiftChangeRequest
);
router.patch(
  '/:id',
  restrictTo('manager', 'admin'),
  auditLogger('UPDATE', 'ShiftChange', 'ShiftChange'),
  reviewShiftChangeRequest
);

export default router;
