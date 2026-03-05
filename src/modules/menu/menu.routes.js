import express from 'express';
import * as menuController from './menu.controller.js';
import {
  protect,
  requirePermission,
  restrictTo,
} from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// ============ Menu Schedule Routes ============
// Must be defined before /:id to avoid conflicts
router.get('/schedules', menuController.getAllMenuSchedules);
router.get('/schedules/:id', menuController.getMenuScheduleById);

// Protected schedule routes
router.post(
  '/schedules',
  protect,
  restrictTo('staff', 'admin', 'manager'),
  auditLogger('CREATE', 'MenuSchedule', 'MenuSchedule'),
  menuController.createMenuSchedule
);
router.post(
  '/schedules/:id/duplicate',
  protect,
  restrictTo('staff', 'admin', 'manager'),
  auditLogger('CREATE', 'MenuSchedule', 'MenuSchedule'),
  menuController.duplicateSchedule
);
router.patch(
  '/schedules/:id',
  protect,
  restrictTo('staff', 'admin', 'manager'),
  auditLogger('UPDATE', 'MenuSchedule', 'MenuSchedule'),
  menuController.updateMenuSchedule
);
router.patch(
  '/schedules/:id/toggle',
  protect,
  restrictTo('staff', 'admin', 'manager'),
  auditLogger('UPDATE', 'MenuSchedule', 'MenuSchedule'),
  menuController.toggleScheduleStatus
);
router.delete(
  '/schedules/:id',
  protect,
  restrictTo('staff', 'admin', 'manager'),
  auditLogger('DELETE', 'MenuSchedule', 'MenuSchedule'),
  menuController.deleteMenuSchedule
);

// ============ Menu Routes ============
// Public routes
router.get('/', menuController.getAllMenus);
router.get(
  '/canteen/:canteenId/current-menu',
  menuController.getCurrentMenuByCanteen
);
router.get('/:id', menuController.getMenuById);

// Protected routes
router.use(protect);
router.use(restrictTo('staff', 'admin', 'manager'));

router.post(
  '/',
  auditLogger('CREATE', 'Menu', 'Menu'),
  menuController.createMenu
);

router.patch(
  '/:id',
  auditLogger('UPDATE', 'Menu', 'Menu'),
  menuController.updateMenu
);

// Menu items management
router.post(
  '/:id/items',
  auditLogger('UPDATE', 'Menu', 'Menu'),
  menuController.addMenuItem
);
router.delete(
  '/:id/items/:productId',
  auditLogger('UPDATE', 'Menu', 'Menu'),
  menuController.removeMenuItem
);

// Admin only
router.delete(
  '/:id',
  restrictTo('admin', 'manager'),
  auditLogger('DELETE', 'Menu', 'Menu'),
  menuController.deleteMenu
);

export default router;
