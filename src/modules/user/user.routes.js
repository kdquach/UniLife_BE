import express from 'express';
import * as userController from './user.controller.js';
import * as systemUserController from './systemUser.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';
import {
  getSystemUsersRules,
  createSystemUserRules,
  updateSystemUserRules,
  statusChangeRules,
  assignRoleRules,
  removeRoleRules,
} from './systemUser.validator.js';

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

// ═══════════════════════════════════════════════════════════
// System User Management — User Governance Module
// ═══════════════════════════════════════════════════════════

// View system users (admin, canteen_owner, manager)
router.get(
  '/system',
  restrictTo('admin', 'canteen_owner', 'manager'),
  getSystemUsersRules,
  systemUserController.getSystemUsers
);

// Create system user
router.post(
  '/system',
  restrictTo('admin', 'canteen_owner', 'manager'),
  createSystemUserRules,
  auditLogger('CREATE', 'User', 'User'),
  systemUserController.createSystemUser
);

// Update system user info
router.patch(
  '/system/:userId',
  restrictTo('admin', 'canteen_owner', 'manager'),
  updateSystemUserRules,
  auditLogger('UPDATE', 'User', 'User'),
  systemUserController.updateSystemUser
);

// Disable system user
router.patch(
  '/system/:userId/disable',
  restrictTo('admin', 'canteen_owner', 'manager'),
  statusChangeRules,
  auditLogger('UPDATE', 'User', 'User'),
  systemUserController.disableSystemUser
);

// Re-enable system user
router.patch(
  '/system/:userId/reenable',
  restrictTo('admin', 'canteen_owner', 'manager'),
  statusChangeRules,
  auditLogger('UPDATE', 'User', 'User'),
  systemUserController.reenableSystemUser
);

// Reissue system user password
router.patch(
  '/system/:userId/reissue-password',
  restrictTo('admin', 'canteen_owner', 'manager'),
  auditLogger('UPDATE', 'User', 'User'),
  systemUserController.reissuePassword
);

// Assign role to system user
router.patch(
  '/system/:userId/role',
  restrictTo('admin', 'canteen_owner', 'manager'),
  assignRoleRules,
  auditLogger('UPDATE', 'User', 'User'),
  systemUserController.assignRole
);

// Remove/downgrade role
router.delete(
  '/system/:userId/role',
  restrictTo('admin', 'canteen_owner', 'manager'),
  removeRoleRules,
  auditLogger('UPDATE', 'User', 'User'),
  systemUserController.removeRole
);

// Delete pending system user
router.delete(
  '/system/:userId',
  restrictTo('admin', 'canteen_owner', 'manager'),
  auditLogger('DELETE', 'User', 'User'),
  systemUserController.deletePendingSystemUser
);

// ═══════════════════════════════════════════════════════════

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

