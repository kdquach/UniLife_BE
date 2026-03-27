import express from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';
import {
  getMyShiftChangeRequests,
  getShiftChangeRequests,
  createShiftChangeRequest,
  reviewShiftChangeRequest,
} from './shiftChange.controller.js';
import {
  listShiftChangeRequestsRules,
  createShiftChangeRequestRules,
  reviewShiftChangeRequestRules,
} from './shiftChange.validator.js';

const router = express.Router();

router.use(protect);

router.get(
  '/',
  restrictTo('manager', 'admin'),
  listShiftChangeRequestsRules,
  getShiftChangeRequests
);
router.get(
  '/my',
  restrictTo('staff', 'manager', 'admin'),
  listShiftChangeRequestsRules,
  getMyShiftChangeRequests
);
router.post(
  '/',
  restrictTo('staff', 'manager', 'admin'),
  createShiftChangeRequestRules,
  auditLogger('CREATE', 'ShiftChange', 'ShiftChange'),
  createShiftChangeRequest
);
router.patch(
  '/:id',
  restrictTo('manager', 'admin'),
  reviewShiftChangeRequestRules,
  auditLogger('UPDATE', 'ShiftChange', 'ShiftChange'),
  reviewShiftChangeRequest
);

export default router;
