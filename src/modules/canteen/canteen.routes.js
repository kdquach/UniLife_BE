import express from 'express';
import * as canteenController from './canteen.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Public routes
router.get('/', canteenController.getAllCanteens);
router.get('/:id', canteenController.getCanteenById);

// Protected routes
router.use(protect);
// Admin-only management routes
router.use(restrictTo('admin', 'manager'));

router.post(
  '/',
  auditLogger('CREATE', 'Canteen', 'Canteen'),
  canteenController.createCanteen
);
router.patch(
  '/:id',
  auditLogger('UPDATE', 'Canteen', 'Canteen'),
  canteenController.updateCanteen
);
router.delete(
  '/:id',
  auditLogger('DELETE', 'Canteen', 'Canteen'),
  canteenController.deleteCanteen
);

export default router;
