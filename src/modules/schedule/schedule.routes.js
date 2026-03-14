import express from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';
import {
  createSchedule,
  publishSchedule,
  getPublishedSchedule,
  getDraftSchedule,
} from './schedule.controller.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  restrictTo('manager', 'admin'),
  auditLogger('CREATE', 'Schedule', 'Schedule'),
  createSchedule
);
router.post(
  '/:id/publish',
  restrictTo('manager', 'admin'),
  auditLogger('UPDATE', 'Schedule', 'Schedule'),
  publishSchedule
);
router.get('/draft', restrictTo('manager', 'admin'), getDraftSchedule);
router.get(
  '/published',
  restrictTo('staff', 'manager', 'admin'),
  getPublishedSchedule
);

export default router;
