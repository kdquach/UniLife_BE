import { Voucher, VoucherUsage } from "./voucher.model.js";
import AppError from "../../utils/AppError.js";

export const createVoucher = async (voucherData) => {
  const voucher = await Voucher.create(voucherData);
  return voucher;
};

export const getAllVouchers = async (query = {}) => {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.discountType) filter.discountType = query.discountType;

  const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });
  return vouchers;
};

export const getActiveVouchers = async () => {
  const now = new Date();
  const vouchers = await Voucher.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [{ maxUsage: null }, { $expr: { $lt: ["$usedCount", "$maxUsage"] } }],
  }).sort({ endDate: 1 });
  return vouchers;
};

export const getVoucherById = async (id) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }
  return voucher;
};

export const getVoucherByCode = async (code) => {
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }
  return voucher;
};

export const validateVoucher = async (code, orderAmount, userId) => {
  const voucher = await getVoucherByCode(code);

  if (!voucher.isValid()) {
    throw new AppError("Voucher is invalid or expired", 400);
  }

  if (orderAmount < voucher.minOrderAmount) {
    throw new AppError(
      `Minimum order amount is ${voucher.minOrderAmount}`,
      400,
    );
  }

  // Check if user already used this voucher (optional: can be per-user limit)
  const existingUsage = await VoucherUsage.findOne({
    voucherId: voucher._id,
    userId,
  });
  if (existingUsage) {
    throw new AppError("You have already used this voucher", 400);
  }

  const discount = voucher.calculateDiscount(orderAmount);
  return { voucher, discount };
};

export const updateVoucher = async (id, updateData) => {
  const voucher = await Voucher.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }
  return voucher;
};

export const deleteVoucher = async (id) => {
  const voucher = await Voucher.findByIdAndDelete(id);
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }
};

export const applyVoucher = async (
  voucherId,
  orderId,
  userId,
  discountAmount,
) => {
  const voucher = await Voucher.findById(voucherId);
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }

  // Create usage record
  const usage = await VoucherUsage.create({
    voucherId,
    orderId,
    userId,
    discountAmount,
  });

  // Increment used count
  voucher.usedCount += 1;
  await voucher.save();

  return usage;
};

export const getVoucherUsageStats = async (voucherId) => {
  const usages = await VoucherUsage.find({ voucherId })
    .populate("userId", "fullName email")
    .populate("orderId", "totalAmount")
    .sort({ createdAt: -1 });

  const totalDiscountGiven = usages.reduce(
    (sum, u) => sum + u.discountAmount,
    0,
  );

  return {
    usageCount: usages.length,
    totalDiscountGiven,
    usages,
  };
};

export const getUserVoucherUsage = async (userId) => {
  const usages = await VoucherUsage.find({ userId })
    .populate("voucherId", "code discountType value")
    .sort({ createdAt: -1 });
  return usages;
};
