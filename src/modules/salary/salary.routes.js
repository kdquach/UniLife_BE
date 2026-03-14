import express from 'express';
import * as salaryController from './salary.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Staff routes - nhân viên xem lương của chính mình
router.get(
  '/my-salaries',
  restrictTo('staff', 'canteen_owner', 'manager', 'admin'),
  salaryController.getMySalaries
);

// Manager/Admin routes - quản lý lương của toàn bộ canteen
router.use(restrictTo('canteen_owner', 'manager', 'admin'));

router.get('/', salaryController.getAllSalaries);
router.get('/stats', salaryController.getSalaryStats);
router.post(
  '/',
  auditLogger('CREATE', 'Salary', 'Salary'),
  salaryController.createSalary
);
router.post(
  '/calculate',
  auditLogger('CREATE', 'Salary', 'Salary'),
  salaryController.calculateSalary
);
router.post(
  '/bulk-calculate',
  auditLogger('CREATE', 'Salary', 'Salary'),
  salaryController.bulkCalculateSalaries
);

router.get('/:id', salaryController.getSalaryById);
router.patch(
  '/:id',
  auditLogger('UPDATE', 'Salary', 'Salary'),
  salaryController.updateSalary
);
router.patch(
  '/:id/approve',
  auditLogger('UPDATE', 'Salary', 'Salary'),
  salaryController.approveSalary
);
router.patch(
  '/:id/pay',
  auditLogger('UPDATE', 'Salary', 'Salary'),
  salaryController.markAsPaid
);
router.delete(
  '/:id',
  auditLogger('DELETE', 'Salary', 'Salary'),
  salaryController.deleteSalary
);

export default router;
