import catchAsync from "../../utils/catchAsync.js";
import * as voucherService from "./voucher.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
  buildDateRangeFilter,
} from "../../utils/queryHelper.js";
import { Voucher } from "./voucher.model.js";
import { VoucherUsageHistory } from "./voucherHistory.model.js";
import * as XLSX from "xlsx";

// =============================================
// CRUD ENDPOINTS
// =============================================

export const createVoucher = catchAsync(async (req, res) => {
  // Tự động gán canteenId của manager vào voucher nếu frontend không gửi
  if (req.user.role === 'manager' && req.user.canteenId) {
    if (!req.body.canteen_ids || req.body.canteen_ids.length === 0) {
      req.body.canteen_ids = [req.user.canteenId];
    }
  }

  const voucher = await voucherService.createVoucher(req.body, req.user._id);
  res.status(201).json({ status: "success", data: { voucher } });
});

/**
 * F-01, F-12: View Voucher List with role-based filtering
 * Admin: sees all vouchers across all branches
 * Manager: sees only vouchers of their canteen(s) + Global vouchers (read-only)
 * Supports: search, filter by state/scope/discountType/branch, sort, pagination
 * By default hides Archived vouchers unless ?showArchived=true
 */
export const getAllVouchers = catchAsync(async (req, res) => {
  const baseFilter = {};

  // Role-based filtering (BR11)
  if (req.user.role === "manager" && req.user.canteenId) {
    // Manager sees: vouchers of their canteen + Global vouchers
    baseFilter.$or = [{ scope: "Global" }, { canteen_ids: req.user.canteenId }];
  }

  // Hide Archived by default (FR02)
  if (req.query.showArchived !== "true") {
    baseFilter.state = baseFilter.state || { $ne: "Archived" };
  }

  const result = await paginatedQuery(Voucher, req.query, {
    ...filterPresets.voucher,
    baseFilter,
    populate: [
      { path: "canteen_ids", select: "name" },
      { path: "createdBy", select: "fullName email" },
      { path: "categoryIds", select: "name" },
      { path: "productIds", select: "name price" },
    ],
    maxLimit: 50,
  });

  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy danh sách voucher thành công"));
});

export const getActiveVouchers = catchAsync(async (req, res) => {
  const vouchers = await voucherService.getActiveVouchers();
  res
    .status(200)
    .json({ status: "success", results: vouchers.length, data: { vouchers } });
});

/**
 * F-02: View Voucher Detail (Config + Usage Summary)
 */
export const getVoucherById = catchAsync(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id)
    .populate("canteen_ids", "name location")
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email")
    .populate("productIds", "name price")
    .populate("categoryIds", "name");

  if (!voucher) {
    return res
      .status(404)
      .json({ status: "fail", message: "Voucher not found" });
  }

  // Build usage summary statistics
  const stats = await voucherService.getVoucherUsageStats(req.params.id);

  // Calculate usage rate
  const usageRate = voucher.totalLimit
    ? ((voucher.usedCount / voucher.totalLimit) * 100).toFixed(1)
    : null;

  res.status(200).json({
    status: "success",
    data: {
      voucher,
      statistics: {
        totalUsage: stats.usageCount,
        totalDiscountGiven: stats.totalDiscountGiven,
        totalRevenue: stats.totalRevenue,
        usageRate: usageRate ? `${usageRate}%` : "Unlimited",
        usageDisplay: voucher.totalLimit
          ? `${voucher.usedCount}/${voucher.totalLimit}`
          : `${voucher.usedCount}/∞`,
      },
    },
  });
});

export const getVoucherByCode = catchAsync(async (req, res) => {
  const voucher = await voucherService.getVoucherByCode(req.params.code);
  res.status(200).json({ status: "success", data: { voucher } });
});

export const validateVoucher = catchAsync(async (req, res) => {
  const { code, orderTotal, items, canteenId } = req.body;

  if (!code) {
    return res.status(400).json({
      status: "fail",
      message: "Vui lòng nhập mã voucher",
    });
  }

  if (!orderTotal || orderTotal <= 0) {
    return res.status(400).json({
      status: "fail",
      message: "Giá trị đơn hàng không hợp lệ",
    });
  }

  const result = await voucherService.validateVoucherForApply(
    code,
    orderTotal,
    items || [],
    canteenId,
    req.user._id,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const updateVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.updateVoucher(
    req.params.id,
    req.body,
    req.user._id,
  );
  res.status(200).json({ status: "success", data: { voucher } });
});

export const deleteVoucher = catchAsync(async (req, res) => {
  await voucherService.deleteVoucher(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

// =============================================
// USAGE HISTORY & STATS ENDPOINTS (F-11)
// =============================================

/**
 * F-11: Get usage stats for a specific voucher
 */
export const getVoucherUsageStats = catchAsync(async (req, res) => {
  const stats = await voucherService.getVoucherUsageStats(req.params.id);
  res.status(200).json({ status: "success", data: { stats } });
});

/**
 * F-11: Get usage history for a specific voucher (paginated table)
 * Supports filters: time range, branch/canteen, order status, voucher status
 */
export const getVoucherUsageHistory = catchAsync(async (req, res) => {
  const baseFilter = { voucherId: req.params.id };

  // Filter by canteen (branch)
  if (req.query.canteenId) {
    baseFilter.canteenId = req.query.canteenId;
  }

  // Filter by order status
  if (req.query.orderStatus) {
    baseFilter.orderStatus = req.query.orderStatus;
  }

  // Filter by voucher status
  if (req.query.voucherStatus) {
    baseFilter.voucherStatus = req.query.voucherStatus;
  }

  // Date range filter
  const dateFilter = buildDateRangeFilter(
    req.query.startDate,
    req.query.endDate,
    "createdAt",
  );

  const result = await paginatedQuery(VoucherUsageHistory, req.query, {
    baseFilter: { ...baseFilter, ...dateFilter },
    populate: [
      { path: "orderId", select: "orderNumber totalAmount status" },
      { path: "canteenId", select: "name" },
      { path: "userId", select: "fullName email" },
    ],
    allowedSortFields: ["createdAt", "discountAmount", "finalAmount"],
    defaultSort: "-createdAt",
  });

  res
    .status(200)
    .json(
      formatPaginatedResponse(result, "Lấy lịch sử sử dụng voucher thành công"),
    );
});

/**
 * User's own voucher usage history
 */
export const getMyVoucherUsage = catchAsync(async (req, res) => {
  const result = await paginatedQuery(VoucherUsageHistory, req.query, {
    baseFilter: { userId: req.user._id },
    populate: [
      {
        path: "voucherId",
        select: "code displayDescription discountType discountValue",
      },
      { path: "orderId", select: "orderNumber totalAmount" },
    ],
    allowedSortFields: ["createdAt"],
    defaultSort: "-createdAt",
  });
  res
    .status(200)
    .json(
      formatPaginatedResponse(result, "Lấy lịch sử sử dụng voucher thành công"),
    );
});

// =============================================
// EXPORT ENDPOINTS (F-13)
// =============================================

/**
 * F-13: Export Usage Report (CSV / Excel)
 * Query params: format=csv|xlsx, startDate, endDate, canteenId, state, discountType
 */
export const exportUsageReport = catchAsync(async (req, res) => {
  const {
    format = "xlsx",
    startDate,
    endDate,
    canteenId,
    state,
    discountType,
  } = req.query;

  // Build filter for vouchers
  const voucherFilter = {};
  if (state) voucherFilter.state = state;
  if (discountType) voucherFilter.discountType = discountType;

  // Role-based: Manager only sees their canteen
  if (req.user.role === "manager" && req.user.canteenId) {
    voucherFilter.$or = [
      { scope: "Global" },
      { canteen_ids: req.user.canteenId },
    ];
  } else if (canteenId) {
    voucherFilter.canteen_ids = canteenId;
  }

  const vouchers = await Voucher.find(voucherFilter)
    .populate("canteen_ids", "name")
    .lean();

  // Build usage date filter
  const dateFilter = buildDateRangeFilter(startDate, endDate, "createdAt");

  // For each voucher, get usage summary
  const rows = [];
  for (const v of vouchers) {
    const usageFilter = { voucherId: v._id, ...dateFilter };
    const usages = await VoucherUsageHistory.find(usageFilter).lean();

    const totalDiscount = usages.reduce((sum, u) => sum + u.discountAmount, 0);
    const totalRevenue = usages.reduce((sum, u) => sum + u.finalAmount, 0);
    const usageRate = v.totalLimit
      ? ((v.usedCount / v.totalLimit) * 100).toFixed(1)
      : "∞";

    rows.push({
      "Voucher Code": v.code,
      "Tên chương trình": v.name,
      Branch: v.canteen_ids?.map((c) => c.name).join(", ") || "Global",
      Discount:
        v.discountType === "Percentage"
          ? `${v.discountValue || 0}% (tối đa ${(v.maxDiscountCap || 0).toLocaleString("vi-VN")}đ)`
          : `Fixed ${(v.discountValue || 0).toLocaleString("vi-VN")}đ`,
      "Tổng lượt sử dụng": usages.length,
      "Tổng tiền giảm (VNĐ)": totalDiscount,
      "Tổng doanh thu từ voucher (VNĐ)": totalRevenue,
      "Tỷ lệ sử dụng (%)": usageRate,
      "Trạng thái": v.state,
      "Thời gian hiệu lực": `${new Date(v.startDatetime).toLocaleDateString("vi-VN")} - ${new Date(v.endDatetime).toLocaleDateString("vi-VN")}`,
    });
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Voucher Report");

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=voucher-report.csv",
    );
    return res.send("\uFEFF" + csv); // BOM for Vietnamese characters
  }

  // Default: xlsx
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=voucher-report.xlsx",
  );
  return res.send(Buffer.from(buffer));
});

// =============================================
// STATE MANAGEMENT ENDPOINTS (PRD v6)
// =============================================

/**
 * F-05: Clone Voucher
 */
export const cloneVoucher = catchAsync(async (req, res) => {
  const clonedData = await voucherService.cloneVoucher(
    req.params.id,
    req.user._id,
  );
  res.status(200).json({
    status: "success",
    message:
      "Voucher cloned as Draft. Please complete required fields (code, dates) and save.",
    data: { voucher: clonedData },
  });
});

/**
 * F-06: Publish Voucher (Draft -> Upcoming)
 */
export const publishVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.publishVoucher(
    req.params.id,
    req.user._id,
  );
  res.status(200).json({
    status: "success",
    message:
      "Voucher published successfully. It will auto-activate at start time.",
    data: { voucher },
  });
});

/**
 * F-07: Deactivate Voucher (Active -> Inactive)
 */
export const deactivateVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.deactivateVoucher(
    req.params.id,
    req.user._id,
  );
  res.status(200).json({
    status: "success",
    message: "Voucher deactivated successfully.",
    data: { voucher },
  });
});

/**
 * F-08: Reactivate Voucher (Inactive -> Active)
 */
export const reactivateVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.reactivateVoucher(
    req.params.id,
    req.user._id,
  );
  res.status(200).json({
    status: "success",
    message: "Voucher reactivated successfully.",
    data: { voucher },
  });
});

/**
 * F-09: Archive Voucher (Expired/OutOfQuota -> Archived)
 */
export const archiveVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.archiveVoucher(
    req.params.id,
    req.user._id,
  );
  res.status(200).json({
    status: "success",
    message: "Voucher archived successfully.",
    data: { voucher },
  });
});

/**
 * BR01: Auto-generate voucher code
 */
export const generateCode = catchAsync(async (req, res) => {
  const code = await voucherService.generateVoucherCode();
  res.status(200).json({
    status: "success",
    data: { code },
  });
});
