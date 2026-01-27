import mongoose from "mongoose";
import { Voucher, VoucherUsage } from "./voucher.model.js";
import AppError from "../../utils/AppError.js";
import { buildValidationChain } from "./voucherValidator.js";
import { discountCalculator } from "./discountCalculator.js";

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

/**
 * Validate voucher for applying (Phase 1: Preview)
 * Uses Chain of Responsibility pattern
 * @param {string} code - Voucher code
 * @param {number} orderTotal - Total order amount
 * @param {Array} items - Cart items [{productId, quantity, price}]
 * @param {string} campusId - Campus ID (from cart/order context)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { voucher, discountAmount } or throws AppError
 */
export const validateVoucherForApply = async (
  code,
  orderTotal,
  items,
  campusId,
  userId,
) => {
  // Find voucher by code
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });

  // Build validation context
  const context = {
    voucher,
    orderTotal,
    items: items || [],
    campusId,
    userId,
  };

  // Run validation chain
  const validationChain = buildValidationChain();
  const result = await validationChain.validate(context);

  if (!result.valid) {
    throw new AppError(result.error, result.code || 400);
  }

  // Calculate discount using Strategy Pattern
  const discountAmount = discountCalculator.calculate(
    voucher,
    orderTotal,
    items,
  );

  return {
    voucher: {
      _id: voucher._id,
      code: voucher.code,
      discountType: voucher.discountType,
      value: voucher.value,
      maxDiscount: voucher.maxDiscount,
      description: voucher.description,
    },
    discountAmount,
    message: `Áp dụng voucher thành công! Giảm ${discountAmount.toLocaleString("vi-VN")}đ`,
  };
};

// Keep old validateVoucher for backward compatibility
export const validateVoucher = async (code, orderAmount, userId) => {
  return validateVoucherForApply(code, orderAmount, [], null, userId);
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

/**
 * Commit voucher usage (Phase 2: Checkout)
 * Uses Optimistic Locking to prevent race conditions
 * @param {string} voucherId - Voucher ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @param {number} discountAmount - Calculated discount amount
 * @param {Object} session - MongoDB session (optional, for transaction)
 * @returns {Promise<Object>} VoucherUsage record
 */
export const commitVoucher = async (
  voucherId,
  orderId,
  userId,
  discountAmount,
  session = null,
) => {
  // Optimistic locking: Only increment if usedCount < maxUsage
  // This atomic operation prevents race conditions
  const updateResult = await Voucher.findOneAndUpdate(
    {
      _id: voucherId,
      $or: [
        { maxUsage: null }, // Unlimited usage
        { $expr: { $lt: ["$usedCount", "$maxUsage"] } }, // Still has remaining usage
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true, session },
  );

  if (!updateResult) {
    throw new AppError("Voucher đã hết lượt sử dụng", 400);
  }

  // Create usage record
  const usageData = {
    voucherId,
    orderId,
    userId,
    discountAmount,
  };

  const usage = session
    ? await VoucherUsage.create([usageData], { session }).then(
        (docs) => docs[0],
      )
    : await VoucherUsage.create(usageData);

  return usage;
};

// Keep old applyVoucher for backward compatibility (deprecated)
export const applyVoucher = commitVoucher;

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
