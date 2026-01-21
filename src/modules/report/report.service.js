import {
  ReportSnapshot,
  AuditLog,
  ShiftSummary,
  PickupLog,
} from "./report.model.js";
import { Order } from "../order/order.model.js";
import AppError from "../../utils/AppError.js";

// ============ Report Snapshot Services ============

export const createReportSnapshot = async (reportData, generatedBy) => {
  const report = await ReportSnapshot.create({ ...reportData, generatedBy });
  return report;
};

export const generateDailyReport = async (canteenId, date, generatedBy) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Aggregate order data
  const orderStats = await Order.aggregate([
    {
      $match: {
        canteenId: new mongoose.Types.ObjectId(canteenId),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
        avgOrderValue: { $avg: "$totalPrice" },
      },
    },
  ]);

  // Get top products
  const topProducts = await Order.aggregate([
    {
      $match: {
        canteenId: new mongoose.Types.ObjectId(canteenId),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: "completed",
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        productName: { $first: "$items.productName" },
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 },
  ]);

  const stats = orderStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  };

  const reportData = {
    canteenId,
    reportType: "daily",
    reportName: `Daily Report - ${date.toISOString().split("T")[0]}`,
    periodStart: startOfDay,
    periodEnd: endOfDay,
    data: {
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      averageOrderValue: stats.avgOrderValue,
      topProducts: topProducts.map((p) => ({
        productId: p._id,
        productName: p.productName,
        quantitySold: p.quantitySold,
        revenue: p.revenue,
      })),
    },
    generatedBy,
    generatedAt: new Date(),
  };

  const report = await ReportSnapshot.create(reportData);
  return report;
};

export const getReportSnapshots = async (canteenId, query = {}) => {
  const filter = { canteenId };
  if (query.reportType) filter.reportType = query.reportType;
  if (query.periodStart)
    filter.periodStart = { $gte: new Date(query.periodStart) };
  if (query.periodEnd) filter.periodEnd = { $lte: new Date(query.periodEnd) };

  const reports = await ReportSnapshot.find(filter)
    .populate("generatedBy", "fullName")
    .sort({ createdAt: -1 });
  return reports;
};

export const getReportSnapshotById = async (id) => {
  const report = await ReportSnapshot.findById(id).populate(
    "generatedBy",
    "fullName",
  );
  if (!report) {
    throw new AppError("Report not found", 404);
  }
  return report;
};

export const deleteReportSnapshot = async (id) => {
  const report = await ReportSnapshot.findByIdAndDelete(id);
  if (!report) {
    throw new AppError("Report not found", 404);
  }
};

// ============ Audit Log Services ============

export const createAuditLog = async (auditData) => {
  const log = await AuditLog.create(auditData);
  return log;
};

export const getAuditLogs = async (query = {}) => {
  const filter = {};
  if (query.canteenId) filter.canteenId = query.canteenId;
  if (query.userId) filter.userId = query.userId;
  if (query.action) filter.action = query.action;
  if (query.entity) filter.entity = query.entity;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.startDate && query.endDate) {
    filter.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};

export const getAuditLogsByEntity = async (entity, entityId) => {
  const logs = await AuditLog.find({ entity, entityId })
    .populate("userId", "fullName email")
    .sort({ createdAt: -1 });
  return logs;
};

// ============ Shift Summary Services ============

export const createOrUpdateShiftSummary = async (summaryData) => {
  const summary = await ShiftSummary.findOneAndUpdate(
    { shiftId: summaryData.shiftId, date: summaryData.date },
    summaryData,
    { new: true, upsert: true, runValidators: true },
  );
  return summary;
};

export const getShiftSummaries = async (canteenId, query = {}) => {
  const filter = { canteenId };
  if (query.date) {
    const date = new Date(query.date);
    filter.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999)),
    };
  }
  if (query.status) filter.status = query.status;

  const summaries = await ShiftSummary.find(filter)
    .populate("shiftId", "name startTime endTime")
    .populate("staffAssigned", "fullName")
    .populate("reviewedBy", "fullName")
    .sort({ date: -1 });
  return summaries;
};

export const getShiftSummaryById = async (id) => {
  const summary = await ShiftSummary.findById(id)
    .populate("shiftId", "name startTime endTime")
    .populate("staffAssigned", "fullName")
    .populate("reviewedBy", "fullName");
  if (!summary) {
    throw new AppError("Shift summary not found", 404);
  }
  return summary;
};

export const reviewShiftSummary = async (id, reviewData, reviewedBy) => {
  const summary = await ShiftSummary.findByIdAndUpdate(
    id,
    {
      ...reviewData,
      status: "reviewed",
      reviewedBy,
      reviewedAt: new Date(),
    },
    { new: true, runValidators: true },
  );
  if (!summary) {
    throw new AppError("Shift summary not found", 404);
  }
  return summary;
};

// ============ Pickup Log Services ============

export const createPickupLog = async (logData) => {
  const log = await PickupLog.create(logData);
  return log;
};

export const getPickupLogsByOrder = async (orderId) => {
  const logs = await PickupLog.find({ orderId })
    .populate("staffId", "fullName")
    .sort({ createdAt: -1 });
  return logs;
};

export const getPickupLogs = async (canteenId, query = {}) => {
  const filter = { canteenId };
  if (query.action) filter.action = query.action;
  if (query.startDate && query.endDate) {
    filter.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const logs = await PickupLog.find(filter)
    .populate("orderId", "orderNumber")
    .populate("customerId", "fullName")
    .populate("staffId", "fullName")
    .sort({ createdAt: -1 })
    .limit(query.limit || 100);
  return logs;
};
