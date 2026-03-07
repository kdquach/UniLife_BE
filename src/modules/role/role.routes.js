import express from 'express';
import * as roleController from './role.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(protect);
router.use(restrictTo('admin'));

// Role routes
router
  .route('/')
  .get(roleController.getAllRoles)
  .post(auditLogger('CREATE', 'Role', 'Role'), roleController.createRole);
router
  .route('/:id')
  .get(roleController.getRoleById)
  .patch(auditLogger('UPDATE', 'Role', 'Role'), roleController.updateRole)
  .delete(auditLogger('DELETE', 'Role', 'Role'), roleController.deleteRole);

// Permission routes
router
  .route('/permissions')
  .get(roleController.getAllPermissions)
  .post(
    auditLogger('CREATE', 'Permission', 'Permission'),
    roleController.createPermission
  );
router
  .route('/permissions/:id')
  .get(roleController.getPermissionById)
  .patch(
    auditLogger('UPDATE', 'Permission', 'Permission'),
    roleController.updatePermission
  )
  .delete(
    auditLogger('DELETE', 'Permission', 'Permission'),
    roleController.deletePermission
  );

// Role-Permission routes
router.post(
  '/assign-permission',
  auditLogger('UPDATE', 'Role', 'Role'),
  roleController.assignPermissionToRole
);
router.delete(
  '/remove-permission/:roleId/:permissionId',
  auditLogger('UPDATE', 'Role', 'Role'),
  roleController.removePermissionFromRole
);
router.get('/:roleId/permissions', roleController.getPermissionsByRole);

// User-Role routes
router.post('/assign-user', roleController.assignRoleToUser);
router.delete(
  '/remove-user/:userId/:roleId',
  roleController.removeRoleFromUser
);
router.get('/user/:userId/roles', roleController.getRolesByUser);
router.get('/:roleId/users', roleController.getUsersByRole);

export default router;
