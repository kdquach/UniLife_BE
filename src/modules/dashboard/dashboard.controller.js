/**
 * Dashboard Controller — Canteen Manager Dashboard
 *
 * Thin controller — delegates all business logic to dashboard.service.js
 *
 * Endpoints:
 *   GET /api/dashboard/order-metrics    → getOrderMetrics
 *   GET /api/dashboard/growth-summary   → getGrowthSummary
 *   GET /api/dashboard/revenue          → getRevenueAggregation
 */
import catchAsync from '../../utils/catchAsync.js';
import * as dashboardService from './dashboard.service.js';

/**
 * View Global Order Metrics
 * @route GET /api/dashboard/order-metrics
 * @access Private (Admin, Manager)
 */
export const getOrderMetrics = catchAsync(async (req, res) => {
  const result = await dashboardService.getOrderMetrics(
    req.user.canteenId,
    req.query,
  );

  if (result.error) {
    return res.status(result.statusCode).json({
      status: 'fail',
      error: result.error,
    });
  }

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * View Growth Summary
 * @route GET /api/dashboard/growth-summary
 * @access Private (Admin, Manager)
 */
export const getGrowthSummary = catchAsync(async (req, res) => {
  const result = await dashboardService.getGrowthSummary(
    req.user.canteenId,
    req.query,
  );

  if (result.error) {
    return res.status(result.statusCode).json({
      status: 'fail',
      error: result.error,
    });
  }

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Revenue Aggregation (readonly)
 * @route GET /api/dashboard/revenue
 * @access Private (Admin, Manager)
 */
export const getRevenueAggregation = catchAsync(async (req, res) => {
  const result = await dashboardService.getRevenueAggregation(
    req.user.canteenId,
    req.query,
  );

  if (result.error) {
    return res.status(result.statusCode).json({
      status: 'fail',
      error: result.error,
    });
  }

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
