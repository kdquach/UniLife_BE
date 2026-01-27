import catchAsync from "../../utils/catchAsync.js";
import * as voucherService from "./voucher.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Voucher, VoucherUsage } from "./voucher.model.js";

export const createVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.createVoucher(req.body);
  res.status(201).json({ status: "success", data: { voucher } });
});

export const getAllVouchers = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Voucher, req.query, {
    ...filterPresets.voucher,
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

export const getVoucherById = catchAsync(async (req, res) => {
  const voucher = await voucherService.getVoucherById(req.params.id);
  res.status(200).json({ status: "success", data: { voucher } });
});

export const getVoucherByCode = catchAsync(async (req, res) => {
  const voucher = await voucherService.getVoucherByCode(req.params.code);
  res.status(200).json({ status: "success", data: { voucher } });
});

export const validateVoucher = catchAsync(async (req, res) => {
  const { code, orderTotal, items, campusId } = req.body;

  // Input validation
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
    campusId,
    req.user._id,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const updateVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.updateVoucher(req.params.id, req.body);
  res.status(200).json({ status: "success", data: { voucher } });
});

export const deleteVoucher = catchAsync(async (req, res) => {
  await voucherService.deleteVoucher(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

export const getVoucherUsageStats = catchAsync(async (req, res) => {
  const stats = await voucherService.getVoucherUsageStats(req.params.id);
  res.status(200).json({ status: "success", data: { stats } });
});

export const getMyVoucherUsage = catchAsync(async (req, res) => {
  const result = await paginatedQuery(VoucherUsage, req.query, {
    baseFilter: { userId: req.user._id },
    populate: [
      { path: "voucherId", select: "code description discountType value" },
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
