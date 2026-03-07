import express from 'express';
import * as attendanceController from './attendance.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// All routes require authentication + staff/admin role
router.use(protect);
router.use(restrictTo('staff', 'admin'));

// Today's shifts with attendance status
router.get('/my-shifts', attendanceController.getMyShifts);

// Check-in / Check-out (accepts shift_id in body)
router.post(
  '/checkin',
  auditLogger('CREATE', 'Attendance', 'Attendance'),
  attendanceController.checkIn
);
router.post(
  '/checkout',
  auditLogger('UPDATE', 'Attendance', 'Attendance'),
  attendanceController.checkOut
);

// Attendance history with filters
router.get('/history', attendanceController.getHistory);

// Attendance detail
router.get('/:id', attendanceController.getDetail);

export default router;
