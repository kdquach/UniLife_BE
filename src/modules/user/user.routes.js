import express from 'express';
import * as userController from './user.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get current user profile
router.get('/me', userController.getMe);

// Allow managers and canteen owners to view users list
router.get(
  '/',
  restrictTo('admin', 'canteen_owner', 'manager'),
  userController.getAllUsers
);

// Manager routes - Quản lý nhân viên trong canteen của mình
router.get('/staff', restrictTo('manager'), userController.getManagerStaffList);
router.get(
  '/staff/:id',
  restrictTo('manager'),
  userController.getManagerStaffDetail
);
router.post(
  '/staff',
  restrictTo('manager'),
  auditLogger('CREATE', 'User', 'User'),
  userController.createManagerStaff
);
router.patch(
  '/staff/:id',
  restrictTo('manager'),
  auditLogger('UPDATE', 'User', 'User'),
  userController.updateManagerStaff
);

// Admin only routes for modify operations
router.use(restrictTo('admin'));

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(auditLogger('UPDATE', 'User', 'User'), userController.updateUser)
  .delete(auditLogger('DELETE', 'User', 'User'), userController.deleteUser);

export default router;
