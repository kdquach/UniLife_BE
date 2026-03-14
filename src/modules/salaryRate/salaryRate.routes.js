import express from 'express';
import * as salaryRateController from './salaryRate.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Áp dụng middleware bảo vệ
router.use(protect);
router.use(restrictTo('admin', 'canteen_owner', 'manager'));

// Routes
router
  .route('/')
  .get(salaryRateController.getAllSalaryRates)
  .post(
    auditLogger('CREATE', 'SalaryRate', 'SalaryRate'),
    salaryRateController.setSalaryRate
  );

router.get('/canteen/:canteenId', salaryRateController.getSalaryRatesByCanteen);

router
  .route('/user/:userId')
  .get(salaryRateController.getSalaryRateByUser)
  .delete(
    restrictTo('admin'),
    auditLogger('DELETE', 'SalaryRate', 'SalaryRate'),
    salaryRateController.deleteSalaryRate
  );

export default router;
