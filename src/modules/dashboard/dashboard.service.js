/**
 * Dashboard Service — Canteen Manager Dashboard
 *
 * All business logic for 3 dashboard features:
 *   1. getOrderMetrics     — View Global Order Metrics
 *   2. getGrowthSummary    — View Growth Summary
 *   3. getRevenueAggregation — Revenue Aggregation (readonly)
 *
 * Schema mapping (analysis doc → actual codebase):
 *   orderedAt       → createdAt
 *   paymentStatus   → payment.status (completed/refunded)
 *   paidAmount      → payment.amount
 *   customerId      → userId
 *   items.unitPrice → items.price
 *   items.name      → items.productName
 */
import Order from '../order/order.model.js';
import {
  parseDateRange,
  validateCanteenId,
  buildTimeSeriesGroupId,
  buildKPI,
  formatLabel,
  TIMEZONE,
} from '../../utils/dateRange.js';

// ═══════════════════════════════════════════════════════
// Feature 1: View Global Order Metrics
// ═══════════════════════════════════════════════════════
export const getOrderMetrics = async (canteenId, query) => {
  const { error: canteenError, canteenObjId } = validateCanteenId(canteenId);
  if (canteenError) return { error: canteenError, statusCode: 403 };

  const dateRange = parseDateRange(query);
  if (dateRange.error) return { error: dateRange.error, statusCode: 400 };

  const { from, to, granularity, comparison, meta } = dateRange;

  const [result] = await Order.aggregate([
    {
      $match: {
        canteenId: canteenObjId,
        createdAt: { $gte: comparison.from, $lte: to },
      },
    },
    {
      $facet: {
        // --- KPI current period ---
        currentKPI: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              completedOrders: {
                $sum: {
                  $cond: [{
                    $and: [
                      { $eq: ['$status', 'completed'] },
                      { $eq: ['$payment.status', 'completed'] },
                    ],
                  }, 1, 0],
                },
              },
              cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
              pendingOrders: {
                $sum: {
                  $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing', 'ready']] }, 1, 0],
                },
              },
            },
          },
        ],

        // --- KPI comparison period ---
        comparisonKPI: [
          { $match: { createdAt: { $gte: comparison.from, $lte: comparison.to } } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              completedOrders: {
                $sum: {
                  $cond: [{
                    $and: [
                      { $eq: ['$status', 'completed'] },
                      { $eq: ['$payment.status', 'completed'] },
                    ],
                  }, 1, 0],
                },
              },
              cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            },
          },
        ],

        // --- Unique customers current period ---
        uniqueCustomers: [
          {
            $match: {
              createdAt: { $gte: from, $lte: to },
              status:    { $ne: 'cancelled' },
            },
          },
          { $group: { _id: '$userId' } },
          { $count: 'count' },
        ],

        // --- Time series theo granularity ---
        timeSeries: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id:       buildTimeSeriesGroupId(granularity),
              count:     { $sum: 1 },
              completed: {
                $sum: {
                  $cond: [{
                    $and: [
                      { $eq: ['$status', 'completed'] },
                      { $eq: ['$payment.status', 'completed'] },
                    ],
                  }, 1, 0],
                },
              },
              cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        ],

        // --- QR scan stats ---
        qrStats: [
          {
            $match: {
              createdAt: { $gte: from, $lte: to },
              status:    { $in: ['ready', 'completed'] },
            },
          },
          {
            $group: {
              _id:          null,
              readyCount:   { $sum: 1 },
              scannedCount: { $sum: { $cond: [{ $ifNull: ['$pickupQRCode.scannedAt', false] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ]);

  const curr = result?.currentKPI?.[0]    || {};
  const prev = result?.comparisonKPI?.[0] || {};
  const qr   = result?.qrStats?.[0]       || {};

  const totalCurr = curr.totalOrders || 0;
  const totalPrev = prev.totalOrders || 0;

  // Format time series
  const series = result?.timeSeries || [];
  const timeSeries = {
    labels: series.map((s) => formatLabel(s._id, granularity)),
    datasets: [
      { label: 'Tổng đơn',   data: series.map((s) => s.count) },
      { label: 'Hoàn thành', data: series.map((s) => s.completed) },
      { label: 'Huỷ',        data: series.map((s) => s.cancelled) },
    ],
  };

  return {
    meta: { ...meta, canteenId },
    kpi: {
      totalOrders:     buildKPI('Tổng đơn hàng', totalCurr, totalPrev),
      completedOrders: buildKPI('Đơn hoàn thành', curr.completedOrders || 0, prev.completedOrders || 0),
      cancelledOrders: buildKPI('Đơn huỷ', curr.cancelledOrders || 0, prev.cancelledOrders || 0),
      pendingOrders:   { label: 'Đang xử lý', value: curr.pendingOrders || 0 },
      completionRate:  {
        label: 'Tỉ lệ hoàn thành',
        value: totalCurr > 0 ? +((curr.completedOrders || 0) / totalCurr * 100).toFixed(1) : 0,
        unit:  '%',
      },
      cancellationRate: {
        label: 'Tỉ lệ huỷ',
        value: totalCurr > 0 ? +((curr.cancelledOrders || 0) / totalCurr * 100).toFixed(1) : 0,
        unit:  '%',
      },
      uniqueCustomers: buildKPI('Khách hàng', result?.uniqueCustomers?.[0]?.count || 0, 0),
      qrScanRate: {
        label: 'QR scan rate',
        value: qr.readyCount > 0 ? +(qr.scannedCount / qr.readyCount * 100).toFixed(1) : 0,
        unit:  '%',
      },
    },
    timeSeries,
  };
};

// ═══════════════════════════════════════════════════════
// Feature 2: View Growth Summary
// ═══════════════════════════════════════════════════════
export const getGrowthSummary = async (canteenId, query) => {
  const { error: canteenError, canteenObjId } = validateCanteenId(canteenId);
  if (canteenError) return { error: canteenError, statusCode: 403 };

  const dateRange = parseDateRange(query);
  if (dateRange.error) return { error: dateRange.error, statusCode: 400 };

  const { from, to, granularity, comparison, meta } = dateRange;

  const [result] = await Order.aggregate([
    {
      $match: {
        canteenId: canteenObjId,
        createdAt: { $gte: comparison.from, $lte: to },
        status:    { $ne: 'cancelled' },
      },
    },
    {
      $facet: {
        // Đơn + doanh thu theo kỳ
        ordersByPeriod: [
          {
            $group: {
              _id: { $cond: [{ $gte: ['$createdAt', from] }, 'current', 'previous'] },
              orderCount: { $sum: 1 },
              revenue: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$payment.status', 'completed'] }] },
                    '$payment.amount',
                    0,
                  ],
                },
              },
            },
          },
        ],

        // Khách unique theo kỳ
        customersByPeriod: [
          {
            $group: {
              _id: {
                period:   { $cond: [{ $gte: ['$createdAt', from] }, 'current', 'previous'] },
                customer: '$userId',
              },
            },
          },
          { $group: { _id: '$_id.period', uniqueCustomers: { $sum: 1 } } },
        ],

        // Khách mới trong kỳ hiện tại
        newCustomers: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $group: { _id: '$userId' } },
          {
            $lookup: {
              from:     'orders',
              let:      { custId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$canteenId', canteenObjId] },
                        { $eq: ['$userId', '$$custId'] },
                        { $lt: ['$createdAt', from] },
                        { $ne: ['$status', 'cancelled'] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: 'previousOrders',
            },
          },
          {
            $group: {
              _id: null,
              newCount:       { $sum: { $cond: [{ $eq: [{ $size: '$previousOrders' }, 0] }, 1, 0] } },
              returningCount: { $sum: { $cond: [{ $gt: [{ $size: '$previousOrders' }, 0] }, 1, 0] } },
            },
          },
        ],

        // Growth time series
        growthTimeSeries: [
          {
            $group: {
              _id: {
                period: { $cond: [{ $gte: ['$createdAt', from] }, 'current', 'previous'] },
                time:   buildTimeSeriesGroupId(granularity),
              },
              count:   { $sum: 1 },
              revenue: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$payment.status', 'completed'] }] },
                    '$payment.amount', 0,
                  ],
                },
              },
            },
          },
          { $sort: { '_id.time.year': 1, '_id.time.month': 1, '_id.time.day': 1 } },
        ],
      },
    },
  ]);

  const parseByPeriod = (arr, period) => arr?.find((d) => d._id === period) || {};
  const currOrders = parseByPeriod(result?.ordersByPeriod, 'current');
  const prevOrders = parseByPeriod(result?.ordersByPeriod, 'previous');
  const currCust   = parseByPeriod(result?.customersByPeriod, 'current');
  const prevCust   = parseByPeriod(result?.customersByPeriod, 'previous');
  const newCust    = result?.newCustomers?.[0] || {};

  // Format growth time series (overlay 2 lines)
  const currentSeries  = (result?.growthTimeSeries || []).filter((s) => s._id.period === 'current');
  const previousSeries = (result?.growthTimeSeries || []).filter((s) => s._id.period === 'previous');

  return {
    meta: { ...meta, canteenId },

    growth: {
      orders:    buildKPI('Đơn hàng', currOrders.orderCount || 0, prevOrders.orderCount || 0),
      revenue:   buildKPI('Doanh thu', currOrders.revenue || 0, prevOrders.revenue || 0),
      customers: buildKPI('Khách hàng', currCust.uniqueCustomers || 0, prevCust.uniqueCustomers || 0),
    },

    customerBreakdown: {
      new:       newCust.newCount       || 0,
      returning: newCust.returningCount || 0,
      total:     currCust.uniqueCustomers || 0,
      chart: {
        labels:   ['Khách mới', 'Khách quay lại'],
        datasets: [{
          data: [newCust.newCount || 0, newCust.returningCount || 0],
          backgroundColor: ['#4F46E5', '#10B981'],
        }],
      },
    },

    timeSeries: {
      labels: currentSeries.map((s) => formatLabel(s._id.time, granularity)),
      datasets: [
        {
          label:           'Kỳ này',
          data:            currentSeries.map((s) => s.count),
          borderColor:     '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.1)',
        },
        {
          label:           'Kỳ trước',
          data:            previousSeries.map((s) => s.count),
          borderColor:     '#9CA3AF',
          borderDash:      [5, 5],
          backgroundColor: 'transparent',
        },
      ],
    },
  };
};

// ═══════════════════════════════════════════════════════
// Feature 3: Revenue Aggregation (readonly)
// ═══════════════════════════════════════════════════════
export const getRevenueAggregation = async (canteenId, query) => {
  const { error: canteenError, canteenObjId } = validateCanteenId(canteenId);
  if (canteenError) return { error: canteenError, statusCode: 403 };

  const dateRange = parseDateRange(query);
  if (dateRange.error) return { error: dateRange.error, statusCode: 400 };

  const { from, to, granularity, comparison, meta } = dateRange;

  const [result] = await Order.aggregate([
    {
      $match: {
        canteenId:        canteenObjId,
        createdAt:        { $gte: comparison.from, $lte: to },
        status:           'completed',
        'payment.status': { $in: ['completed', 'refunded'] },
      },
    },
    {
      $facet: {
        // --- Revenue summary current + comparison ---
        revenueSummary: [
          {
            $group: {
              _id: { $cond: [{ $gte: ['$createdAt', from] }, 'current', 'previous'] },
              gross: { $sum: '$payment.amount' },
              refunded: {
                $sum: {
                  $cond: [
                    { $eq: ['$payment.status', 'refunded'] },
                    { $ifNull: ['$payment.refundAmount', 0] },
                    0,
                  ],
                },
              },
              transactionCount: { $sum: 1 },
              maxOrder:         { $max: '$payment.amount' },
              minOrder:         { $min: '$payment.amount' },
              discountTotal:    { $sum: { $ifNull: ['$discount', 0] } },
            },
          },
        ],

        // --- Revenue time series (line chart) ---
        revenueTimeSeries: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id:     buildTimeSeriesGroupId(granularity),
              revenue: { $sum: '$payment.amount' },
              count:   { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        ],

        // --- Theo phương thức thanh toán (donut chart) ---
        byPaymentMethod: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id:   '$payment.method',
              total: { $sum: '$payment.amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ],

        // --- Theo ca trong ngày (bar chart) ---
        byShift: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $addFields: {
              hourICT:   { $hour:   { date: '$createdAt', timezone: TIMEZONE } },
              minuteICT: { $minute: { date: '$createdAt', timezone: TIMEZONE } },
            },
          },
          {
            $addFields: {
              shift: {
                $switch: {
                  branches: [
                    {
                      case: { $and: [
                        { $gte: ['$hourICT', 7] },
                        { $or: [
                          { $lt: ['$hourICT', 9] },
                          { $and: [{ $eq: ['$hourICT', 9] }, { $lt: ['$minuteICT', 30] }] },
                        ] },
                      ] },
                      then: 'morning',
                    },
                    {
                      case: { $and: [
                        { $or: [
                          { $gt: ['$hourICT', 10] },
                          { $and: [{ $eq: ['$hourICT', 10] }, { $gte: ['$minuteICT', 30] }] },
                        ] },
                        { $or: [
                          { $lt: ['$hourICT', 13] },
                          { $and: [{ $eq: ['$hourICT', 13] }, { $lte: ['$minuteICT', 30] }] },
                        ] },
                      ] },
                      then: 'lunch',
                    },
                    {
                      case: { $and: [
                        { $gte: ['$hourICT', 15] },
                        { $or: [
                          { $lt: ['$hourICT', 17] },
                          { $and: [{ $eq: ['$hourICT', 17] }, { $lte: ['$minuteICT', 30] }] },
                        ] },
                      ] },
                      then: 'afternoon',
                    },
                  ],
                  default: 'off_hours',
                },
              },
            },
          },
          {
            $group: {
              _id:     '$shift',
              revenue: { $sum: '$payment.amount' },
              count:   { $sum: 1 },
            },
          },
        ],

        // --- Top 10 món theo doanh thu ---
        topMenuItems: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $unwind: '$items' },
          {
            $group: {
              _id:      '$items.productId',
              name:     { $first: '$items.productName' },
              revenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              quantity: { $sum: '$items.quantity' },
              orders:   { $sum: 1 },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ],

        // --- Hourly heatmap data ---
        hourlyHeatmap: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id: {
                hour:    { $hour:      { date: '$createdAt', timezone: TIMEZONE } },
                weekday: { $dayOfWeek: { date: '$createdAt', timezone: TIMEZONE } },
              },
              revenue: { $sum: '$payment.amount' },
              count:   { $sum: 1 },
            },
          },
          { $sort: { '_id.weekday': 1, '_id.hour': 1 } },
        ],
      },
    },
  ]);

  // Parse
  const parseByPeriod = (arr, period) => arr?.find((d) => d._id === period) || {};
  const currRev = parseByPeriod(result?.revenueSummary, 'current');
  const prevRev = parseByPeriod(result?.revenueSummary, 'previous');

  const gross    = currRev.gross    || 0;
  const refunded = currRev.refunded || 0;
  const net      = gross - refunded;
  const txCount  = currRev.transactionCount || 0;

  // Payment method → donut chart
  const PAYMENT_COLOR_MAP = {
    cash: '#6B7280', momo: '#A855F7', vnpay: '#EF4444',
    sepay: '#3B82F6', balance: '#10B981', bank_transfer: '#F59E0B',
  };
  const paymentMethods = result?.byPaymentMethod || [];
  const paymentMethodChart = {
    labels:   paymentMethods.map((p) => p._id),
    datasets: [{
      data:            paymentMethods.map((p) => p.total),
      backgroundColor: paymentMethods.map((p) => PAYMENT_COLOR_MAP[p._id] || '#94A3B8'),
    }],
    total: gross,
    breakdown: Object.fromEntries(
      paymentMethods.map((p) => [p._id, { total: p.total, count: p.count }]),
    ),
  };

  // Shift → bar chart
  const SHIFT_ORDER  = ['morning', 'lunch', 'afternoon', 'off_hours'];
  const SHIFT_LABELS = { morning: 'Ca sáng', lunch: 'Ca trưa', afternoon: 'Ca chiều', off_hours: 'Ngoài giờ' };
  const shiftMap = Object.fromEntries((result?.byShift || []).map((s) => [s._id, s]));
  const shiftChart = {
    labels:   SHIFT_ORDER.map((s) => SHIFT_LABELS[s]),
    datasets: [{
      label: 'Doanh thu',
      data:  SHIFT_ORDER.map((s) => shiftMap[s]?.revenue || 0),
      backgroundColor: ['#FCD34D', '#F97316', '#818CF8', '#9CA3AF'],
    }],
  };

  return {
    meta: { ...meta, canteenId, readonly: true },

    summary: {
      grossRevenue:   buildKPI('Doanh thu gộp', gross, prevRev.gross || 0),
      netRevenue:     buildKPI('Doanh thu thuần', net, (prevRev.gross || 0) - (prevRev.refunded || 0)),
      refundedAmount: { label: 'Đã hoàn tiền', value: refunded },
      transactions:   buildKPI('Giao dịch', txCount, prevRev.transactionCount || 0),
      avgOrderValue:  {
        label: 'Trung bình / đơn',
        value: txCount > 0 ? Math.round(gross / txCount) : 0,
      },
      maxOrderValue:  { label: 'Đơn lớn nhất', value: currRev.maxOrder || 0 },
      minOrderValue:  { label: 'Đơn nhỏ nhất', value: currRev.minOrder || 0 },
      discountTotal:  { label: 'Tổng giảm giá', value: currRev.discountTotal || 0 },
    },

    revenueTimeSeries: {
      labels:   (result?.revenueTimeSeries || []).map((s) => formatLabel(s._id, granularity)),
      datasets: [{
        label:           'Doanh thu',
        data:            (result?.revenueTimeSeries || []).map((s) => s.revenue),
        borderColor:     '#4F46E5',
        backgroundColor: 'rgba(79,70,229,0.1)',
        fill:            true,
      }],
    },

    byPaymentMethod: paymentMethodChart,
    byShift:         shiftChart,

    topMenuItems: {
      labels:   (result?.topMenuItems || []).map((m) => m.name),
      datasets: [{
        label:           'Doanh thu',
        data:            (result?.topMenuItems || []).map((m) => m.revenue),
        backgroundColor: '#4F46E5',
      }],
      details: result?.topMenuItems || [],
    },

    hourlyHeatmap: result?.hourlyHeatmap || [],
  };
};
