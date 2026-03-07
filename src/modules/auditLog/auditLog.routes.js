import express from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import * as auditLogController from './auditLog.controller.js';

const router = express.Router();

// Bảo vệ tất cả các route - chỉ admin và staff/manager có thể xem
router.use(protect);
router.use(restrictTo('admin', 'staff', 'manager'));

// GET - Lấy danh sách nhật ký hoạt động
router.get('/', auditLogController.getAllAuditLogs);

// GET - Lấy thống kê hoạt động
router.get('/statistics/activity', auditLogController.getActivityStatistics);

// GET - Lấy nhật ký lỗi
router.get('/errors/list', auditLogController.getErrorLogs);

// GET - Lấy nhật ký theo người dùng
router.get('/users/:userId', auditLogController.getAuditLogsByUser);

// GET - Lấy nhật ký theo tài nguyên
router.get(
  '/resources/:resourceType/:resourceId',
  auditLogController.getAuditLogsByResource
);

// GET - Lấy chi tiết một nhật ký
router.get('/:id', auditLogController.getAuditLogById);

// DELETE - Xóa nhật ký cũ (chỉ admin)
router.delete(
  '/cleanup/old',
  restrictTo('admin'),
  auditLogController.deleteOldAuditLogs
);

export default router;
