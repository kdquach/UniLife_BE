import catchAsync from "../../utils/catchAsync.js";
import * as reportService from "./report.service.js";

// ============ Report Snapshot Controllers ============

export const generateDailyReport = catchAsync(async (req, res) => {
  const { canteenId, date } = req.body;
  const report = await reportService.generateDailyReport(
    canteenId,
    new Date(date),
    req.user._id,
  );
  res.status(201).json({ status: "success", data: { report } });
});

export const createReportSnapshot = catchAsync(async (req, res) => {
  const report = await reportService.createReportSnapshot(
    req.body,
    req.user._id,
  );
  res.status(201).json({ status: "success", data: { report } });
});

export const getReportSnapshots = catchAsync(async (req, res) => {
  const reports = await reportService.getReportSnapshots(
    req.params.canteenId,
    req.query,
  );
  res
    .status(200)
    .json({ status: "success", results: reports.length, data: { reports } });
});

export const getReportSnapshotById = catchAsync(async (req, res) => {
  const report = await reportService.getReportSnapshotById(req.params.id);
  res.status(200).json({ status: "success", data: { report } });
});

export const deleteReportSnapshot = catchAsync(async (req, res) => {
  await reportService.deleteReportSnapshot(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

// ============ Audit Log Controllers ============

export const getAuditLogs = catchAsync(async (req, res) => {
  const result = await reportService.getAuditLogs(req.query);
  res
    .status(200)
    .json({ status: "success", ...result, data: { logs: result.logs } });
});

export const getAuditLogsByEntity = catchAsync(async (req, res) => {
  const { entity, entityId } = req.params;
  const logs = await reportService.getAuditLogsByEntity(entity, entityId);
  res
    .status(200)
    .json({ status: "success", results: logs.length, data: { logs } });
});

// ============ Shift Summary Controllers ============

export const getShiftSummaries = catchAsync(async (req, res) => {
  const summaries = await reportService.getShiftSummaries(
    req.params.canteenId,
    req.query,
  );
  res
    .status(200)
    .json({
      status: "success",
      results: summaries.length,
      data: { summaries },
    });
});

export const getShiftSummaryById = catchAsync(async (req, res) => {
  const summary = await reportService.getShiftSummaryById(req.params.id);
  res.status(200).json({ status: "success", data: { summary } });
});

export const reviewShiftSummary = catchAsync(async (req, res) => {
  const summary = await reportService.reviewShiftSummary(
    req.params.id,
    req.body,
    req.user._id,
  );
  res.status(200).json({ status: "success", data: { summary } });
});

export const createShiftSummary = catchAsync(async (req, res) => {
  const summary = await reportService.createOrUpdateShiftSummary(req.body);
  res.status(201).json({ status: "success", data: { summary } });
});

// ============ Pickup Log Controllers ============

export const getPickupLogsByOrder = catchAsync(async (req, res) => {
  const logs = await reportService.getPickupLogsByOrder(req.params.orderId);
  res
    .status(200)
    .json({ status: "success", results: logs.length, data: { logs } });
});

export const getPickupLogs = catchAsync(async (req, res) => {
  const logs = await reportService.getPickupLogs(
    req.params.canteenId,
    req.query,
  );
  res
    .status(200)
    .json({ status: "success", results: logs.length, data: { logs } });
});

export const createPickupLog = catchAsync(async (req, res) => {
  const log = await reportService.createPickupLog(req.body);
  res.status(201).json({ status: "success", data: { log } });
});
