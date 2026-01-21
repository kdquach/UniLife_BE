import catchAsync from "../../utils/catchAsync.js";
import * as voucherService from "./voucher.service.js";

export const createVoucher = catchAsync(async (req, res) => {
  const voucher = await voucherService.createVoucher(req.body);
  res.status(201).json({ status: "success", data: { voucher } });
});

export const getAllVouchers = catchAsync(async (req, res) => {
  const vouchers = await voucherService.getAllVouchers(req.query);
  res
    .status(200)
    .json({ status: "success", results: vouchers.length, data: { vouchers } });
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
  const { code, orderAmount } = req.body;
  const result = await voucherService.validateVoucher(
    code,
    orderAmount,
    req.user._id,
  );
  res.status(200).json({ status: "success", data: result });
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
  const usages = await voucherService.getUserVoucherUsage(req.user._id);
  res
    .status(200)
    .json({ status: "success", results: usages.length, data: { usages } });
});
