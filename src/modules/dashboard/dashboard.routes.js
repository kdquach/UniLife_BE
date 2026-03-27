/**
 * Dashboard Routes — Canteen Manager Dashboard
 *
 * GET /api/dashboard/order-metrics    → View Global Order Metrics
 * GET /api/dashboard/growth-summary   → View Growth Summary
 * GET /api/dashboard/revenue          → Revenue Aggregation (readonly)
 *
 * All routes: protected + restricted to admin/manager
 */
import express from 'express';
import * as dashboardController from './dashboard.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);
router.use(restrictTo('admin', 'manager'));

router.get('/order-metrics',  dashboardController.getOrderMetrics);
router.get('/growth-summary', dashboardController.getGrowthSummary);
router.get('/revenue',        dashboardController.getRevenueAggregation);

export default router;
