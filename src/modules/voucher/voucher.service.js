import mongoose from "mongoose";
import { Voucher } from "./voucher.model.js";
import { VoucherUsageHistory } from "./voucherHistory.model.js";
import AppError from "../../utils/AppError.js";
import { buildValidationChain } from "./voucherValidator.js";
import { discountCalculator } from "./discountCalculator.js";

export const createVoucher = async (voucherData, userId) => {
  const data = { ...voucherData, createdBy: userId, updatedBy: userId };

  // Normalize canteen_ids
  if (data.canteenId || data.canteenIds || data.canteen_id) {
    const rawCanteens = data.canteenIds || data.canteen_id || data.canteenId;
    data.canteen_ids = Array.isArray(rawCanteens) ? rawCanteens : [rawCanteens];
    delete data.canteenId;
    delete data.canteenIds;
    delete data.canteen_id;
  } else if (data.canteen_ids && !Array.isArray(data.canteen_ids)) {
    data.canteen_ids = [data.canteen_ids];
  }

  // Normalize categoryIds
  if (data.categories) {
    data.categoryIds = Array.isArray(data.categories) ? data.categories : [data.categories];
    delete data.categories;
  } else if (data.category_ids) {
    data.categoryIds = Array.isArray(data.category_ids) ? data.category_ids : [data.category_ids];
    delete data.category_ids;
  } else if (data.categoryIds && !Array.isArray(data.categoryIds)) {
    data.categoryIds = [data.categoryIds];
  }

  // Normalize productIds
  if (data.products) {
    data.productIds = Array.isArray(data.products) ? data.products : [data.products];
    delete data.products;
  } else if (data.product_ids) {
    data.productIds = Array.isArray(data.product_ids) ? data.product_ids : [data.product_ids];
    delete data.product_ids;
  } else if (data.productIds && !Array.isArray(data.productIds)) {
    data.productIds = [data.productIds];
  }

  const now = new Date();
  const start = new Date(data.startDatetime);
  const end = new Date(data.endDatetime);

  if (start >= end) {
    throw new AppError("Ngày kết thúc phải sau ngày bắt đầu", 400);
  }
  if (end <= now) {
    throw new AppError("Ngày kết thúc phải ở tương lai", 400);
  }

  const voucher = await Voucher.create(data);
  return voucher;
};

export const getAllVouchers = async (query = {}) => {
  const filter = {};
  if (query.state) filter.state = query.state;
  if (query.scope) filter.scope = query.scope;
  if (query.discountType) filter.discountType = query.discountType;

  const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });
  return vouchers;
};

export const getActiveVouchers = async () => {
  const now = new Date();
  
  // Update state for vouchers that should be Expired/OutOfQuota before returning
  // (Optional: for performance, just use filter, but auto-syncing during GET is better for accuracy)
  await autoTransitionVoucherStates();

  const vouchers = await Voucher.find({
    state: "Active",
    startDatetime: { $lte: now },
    endDatetime: { $gte: now },
    $or: [
      { totalLimit: null },
      { $expr: { $lt: ["$usedCount", "$totalLimit"] } },
    ],
  }).sort({ endDatetime: 1 });
  return vouchers;
};

/**
 * Helper to sync state for a single voucher document
 */
const syncVoucherData = async (voucher) => {
  if (!voucher) return voucher;
  const now = new Date();
  let changed = false;

  if (["Active", "Upcoming", "Inactive"].includes(voucher.state) && now > voucher.endDatetime) {
    voucher.state = "Expired";
    changed = true;
  } else if (voucher.state === "Active" && voucher.totalLimit !== null && voucher.usedCount >= voucher.totalLimit) {
    voucher.state = "OutOfQuota";
    changed = true;
  } else if (voucher.state === "Upcoming" && now >= voucher.startDatetime && now <= voucher.endDatetime) {
    voucher.state = "Active";
    changed = true;
  }

  if (changed) {
    await voucher.save();
  }
  return voucher;
};

export const getVoucherById = async (id) => {
  let voucher = await Voucher.findById(id);
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }
  return syncVoucherData(voucher);
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
 * @param {string} canteenId - Canteen ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { voucher, discountAmount } or throws AppError
 */
export const validateVoucherForApply = async (
  code,
  orderTotal,
  items,
  canteenId,
  userId,
) => {
  // Find voucher by code
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });

  // Build validation context
  const context = {
    voucher,
    orderTotal,
    items: items || [],
    canteenId,
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
      discountValue: voucher.discountValue,
      maxDiscountCap: voucher.maxDiscountCap,
      displayDescription: voucher.displayDescription,
    },
    discountAmount,
    message: `Áp dụng voucher thành công! Giảm ${discountAmount.toLocaleString("vi-VN")}đ`,
  };
};

export const updateVoucher = async (id, updateData, userId) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new AppError("Voucher not found", 404);

  // Normalize canteen_ids
  if (updateData.canteenId || updateData.canteenIds || updateData.canteen_id) {
    const rawCanteens = updateData.canteenIds || updateData.canteen_id || updateData.canteenId;
    updateData.canteen_ids = Array.isArray(rawCanteens) ? rawCanteens : [rawCanteens];
    delete updateData.canteenId;
    delete updateData.canteenIds;
    delete updateData.canteen_id;
  } else if (updateData.canteen_ids && !Array.isArray(updateData.canteen_ids)) {
    updateData.canteen_ids = [updateData.canteen_ids];
  }

  // Normalize categoryIds
  if (updateData.categories) {
    updateData.categoryIds = Array.isArray(updateData.categories) ? updateData.categories : [updateData.categories];
    delete updateData.categories;
  } else if (updateData.category_ids) {
    updateData.categoryIds = Array.isArray(updateData.category_ids) ? updateData.category_ids : [updateData.category_ids];
    delete updateData.category_ids;
  } else if (updateData.categoryIds && !Array.isArray(updateData.categoryIds)) {
    updateData.categoryIds = [updateData.categoryIds];
  }

  // Normalize productIds
  if (updateData.products) {
    updateData.productIds = Array.isArray(updateData.products) ? updateData.products : [updateData.products];
    delete updateData.products;
  } else if (updateData.product_ids) {
    updateData.productIds = Array.isArray(updateData.product_ids) ? updateData.product_ids : [updateData.product_ids];
    delete updateData.product_ids;
  } else if (updateData.productIds && !Array.isArray(updateData.productIds)) {
    updateData.productIds = [updateData.productIds];
  }

  const FIELD_LABELS = {
    code: "Mã Voucher",
    name: "Tên chương trình",
    discountType: "Loại giảm giá",
    discountValue: "Giá trị giảm",
    maxDiscountCap: "Giảm tối đa",
    minOrderValue: "Đơn tối thiểu",
    minItemQuantity: "Số lượng món tối thiểu",
    canteen_ids: "Cửa hàng áp dụng",
    productIds: "Sản phẩm áp dụng",
    categoryIds: "Danh mục áp dụng",
    startDatetime: "Ngày bắt đầu",
    endDatetime: "Ngày kết thúc",
    totalLimit: "Tổng lượt sử dụng",
    internalDescription: "Ghi chú nội bộ",
    displayDescription: "Mô tả hiển thị",
    timeRestriction: "Khung giờ áp dụng",
    "timeRestriction.fromTime": "Giờ bắt đầu áp dụng",
    "timeRestriction.toTime": "Giờ kết thúc áp dụng",
    state: "Trạng thái",
    allowStackWithCombo: "Cho phép dùng chung với Combo",
    usagePerUser: "Lượt dùng mỗi khách",
  };

  const STATE_LABELS = {
    Draft: "Bản nháp",
    Upcoming: "Sắp diễn ra",
    Active: "Đang hoạt động",
    Inactive: "Đang tạm ngưng",
    Expired: "Đã hết hạn",
    OutOfQuota: "Đã hết lượt dùng",
    Archived: "Đã lưu trữ",
  };

  // Filter out fields that are the same as current values to avoid triggering "cannot update" errors for unchanged fields
  const finalUpdateData = {};
  for (const key of Object.keys(updateData)) {
    let val1 = voucher[key];
    let val2 = updateData[key];

    // Case 1: Both are essentially "empty" (null, undefined, empty string, empty object)
    const isEmpty1 = !val1 && val1 !== 0 && val1 !== false;
    const isEmpty2 = !val2 && val2 !== 0 && val2 !== false;

    // Specially handle the 'timeRestriction' sub-object sent by FE
    if (key === "timeRestriction") {
      const v1 = val1 || {};
      const v2 = val2 || {};
      if (String(v1.fromTime || "") === String(v2.fromTime || "") &&
          String(v1.toTime || "") === String(v2.toTime || "")) {
        continue;
      }
    }
    
    // Check if it's an "empty-ish" object from FE (e.g. { fromTime: null, toTime: null })
    const isObjectEmpty2 = typeof val2 === 'object' && val2 !== null && Object.values(val2).every(v => !v);
    
    if (isEmpty1 && (isEmpty2 || isObjectEmpty2)) continue;

    // Case 2: Date comparison (Crucial for startDatetime/endDatetime)
    if (val1 instanceof Date || (typeof val1 === "string" && !isNaN(Date.parse(val1)) && (key.includes("Datetime") || key.includes("At")))) {
      if (val1 && val2 && new Date(val1).getTime() === new Date(val2).getTime()) {
        continue;
      }
    }

    // Case 3: Array comparison (canteen_ids, productIds, etc.)
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length === val2.length && val1.every((v, i) => String(v) === String(val2[i]))) {
        continue;
      }
    }

    // Case 4: Object comparison (Any other object fields)
    if (typeof val1 === "object" && typeof val2 === "object" && val1 !== null && val2 !== null) {
      const obj1 = val1.toObject ? val1.toObject() : val1;
      const obj2 = val2.toObject ? val2.toObject() : val2;
      delete obj1._id;
      if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
        continue;
      }
    }

    // Case 5: Primitive comparison
    if (String(val1) !== String(val2)) {
      finalUpdateData[key] = val2;
    }
  }

  // If no actual changes, return early
  if (Object.keys(finalUpdateData).length === 0 && !updateData.updatedBy) {
    return voucher;
  }

  // State-based update restrictions (Active and Inactive)
  if (["Active", "Inactive"].includes(voucher.state)) {
    // Only certain fields can be updated khi Active/Inactive
    const allowedFields = [
      "totalLimit",
      "endDatetime",
      "internalDescription",
      "displayDescription",
    ];

    for (const key of Object.keys(finalUpdateData)) {
      if (!allowedFields.includes(key)) {
        const label = FIELD_LABELS[key] || key;
        const stateLabel = STATE_LABELS[voucher.state] || voucher.state;
        throw new AppError(
          `Không thể cập nhật trường '${label}' khi Voucher đang ở trạng thái ${stateLabel}. Bạn chỉ có thể sửa: Hạn mức, Ngày kết thúc và Mô tả.`,
          400,
        );
      }
    }

    // BR06 check: cannot reduce total limit below used count
    if (
      finalUpdateData.totalLimit !== undefined &&
      finalUpdateData.totalLimit < voucher.usedCount
    ) {
      throw new AppError(
        `Không thể giảm Hạn mức sử dụng xuống thấp hơn số lượng đã dùng (${voucher.usedCount})`,
        400,
      );
    }
  }

  // Final date validation for any state (Draft, Upcoming, Active, Inactive)
  // If either start or end date is updated, re-validate the pair
  if (finalUpdateData.startDatetime || finalUpdateData.endDatetime) {
    const start = new Date(finalUpdateData.startDatetime || voucher.startDatetime);
    const end = new Date(finalUpdateData.endDatetime || voucher.endDatetime);
    const now = new Date();

    if (start >= end) {
      throw new AppError("Ngày kết thúc phải sau ngày bắt đầu", 400);
    }
    
    // Only check if end date is in future IF they are actually changing the end date
    // or if the voucher was already valid and they are moving dates.
    if (finalUpdateData.endDatetime && end <= now) {
        throw new AppError("Ngày kết thúc mới phải ở tương lai", 400);
    }
  }

  const updatedVoucher = await Voucher.findByIdAndUpdate(
    id,
    { ...finalUpdateData, updatedBy: userId },
    {
      new: true,
      runValidators: true,
    },
  );

  // Sync state immediately after update (e.g. if they moved end date to past)
  return syncVoucherData(updatedVoucher);
};

export const deleteVoucher = async (id) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new AppError("Voucher not found", 404);
  if (voucher.usedCount > 0)
    throw new AppError("Cannot delete a voucher that has been used", 400);
  if (voucher.state !== "Draft")
    throw new AppError("Only Draft vouchers can be deleted", 400);
  await Voucher.findByIdAndDelete(id);
};

/**
 * Commit voucher usage (Phase 2: Checkout)
 * Uses Optimistic Locking to prevent race conditions
 * @param {string} voucherId - Voucher ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @param {string} canteenId - Canteen ID
 * @param {number} originalAmount - Un-discounted order total
 * @param {number} discountAmount - Calculated discount amount
 * @param {number} finalAmount - Final amount after discount
 * @param {Object} session - MongoDB session (optional, for transaction)
 * @returns {Promise<Object>} VoucherUsageHistory record
 */
export const commitVoucher = async (
  voucherId,
  orderId,
  userId,
  canteenId,
  originalAmount,
  discountAmount,
  finalAmount,
  session = null,
) => {
  const updateResult = await Voucher.findOneAndUpdate(
    {
      _id: voucherId,
      $or: [
        { totalLimit: null }, // Unlimited usage
        { $expr: { $lt: ["$usedCount", "$totalLimit"] } }, // Still has remaining usage
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true, session },
  );

  if (!updateResult) {
    throw new AppError("Voucher đã hết lượt sử dụng", 400);
  }

  // Create usage history record
  const usageData = {
    voucherId,
    orderId,
    userId,
    canteenId,
    originalAmount,
    discountAmount,
    finalAmount,
    orderStatus: "Completed",
    voucherStatus: "Consumed",
  };

  const usage = session
    ? await VoucherUsageHistory.create([usageData], { session }).then(
        (docs) => docs[0],
      )
    : await VoucherUsageHistory.create(usageData);

  return usage;
};

export const applyVoucher = commitVoucher;

export const getVoucherUsageStats = async (voucherId) => {
  const usages = await VoucherUsageHistory.find({ voucherId })
    .populate("userId", "fullName email")
    .populate("orderId", "totalAmount")
    .populate("canteenId", "name")
    .sort({ createdAt: -1 });

  const totalDiscountGiven = usages.reduce(
    (sum, u) => sum + u.discountAmount,
    0,
  );
  const totalRevenue = usages.reduce((sum, u) => sum + u.finalAmount, 0);

  return {
    usageCount: usages.length,
    totalDiscountGiven,
    totalRevenue,
    usages,
  };
};

export const getUserVoucherUsage = async (userId) => {
  const usages = await VoucherUsageHistory.find({ userId })
    .populate("voucherId", "code discountType discountValue")
    .sort({ createdAt: -1 });
  return usages;
};

// =============================================
// STATE MANAGEMENT FUNCTIONS (PRD v6)
// =============================================

/**
 * F-05: Clone Voucher
 * Creates a copy with reset code, dates, and used_count
 */
export const cloneVoucher = async (id, userId) => {
  const original = await Voucher.findById(id);
  if (!original) throw new AppError("Voucher not found", 404);

  const clonedData = original.toObject();

  // Remove fields that should not be cloned
  delete clonedData._id;
  delete clonedData.__v;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;

  // Reset fields per FR05
  clonedData.code = undefined; // Must be set by user
  clonedData.state = "Draft";
  clonedData.startDatetime = undefined;
  clonedData.endDatetime = undefined;
  clonedData.usedCount = 0;
  clonedData.createdBy = userId;
  clonedData.updatedBy = userId;
  clonedData.changeLog = [];

  return clonedData; // Return data for user to complete before saving
};

/**
 * F-06: Publish Voucher (Draft -> Upcoming)
 * BR02: start_datetime must not be in the past
 */
export const publishVoucher = async (id, userId) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new AppError("Voucher not found", 404);
  if (voucher.state !== "Draft") {
    throw new AppError("Only Draft vouchers can be published", 400);
  }

  const now = new Date();
  if (voucher.startDatetime <= now) {
    throw new AppError("Ngày bắt đầu phải ở tương lai mới có thể phát hành (Publish)", 400);
  }

  voucher.state = "Upcoming";
  voucher.updatedBy = userId;
  voucher.changeLog.push({
    field: "state",
    oldValue: "Draft",
    newValue: "Upcoming",
    changedBy: userId,
    changedAt: now,
  });

  await voucher.save();
  return voucher;
};

/**
 * F-07: Deactivate Voucher (Active -> Inactive)
 */
export const deactivateVoucher = async (id, userId) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new AppError("Voucher not found", 404);
  if (voucher.state !== "Active") {
    throw new AppError("Chỉ có thể tạm ngưng (Deactivate) Voucher đang hoạt động", 400);
  }

  const now = new Date();
  voucher.state = "Inactive";
  voucher.updatedBy = userId;
  voucher.changeLog.push({
    field: "state",
    oldValue: "Active",
    newValue: "Inactive",
    changedBy: userId,
    changedAt: now,
  });

  await voucher.save();
  return voucher;
};

/**
 * F-08: Reactivate Voucher (Inactive -> Active)
 * Conditions: current_time < end_time AND (used_count < total_limit OR total_limit = null)
 */
export const reactivateVoucher = async (id, userId) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new AppError("Voucher not found", 404);
  if (voucher.state !== "Inactive") {
    throw new AppError("Only Inactive vouchers can be reactivated", 400);
  }

  const now = new Date();

  if (now >= voucher.endDatetime) {
    throw new AppError(
      `Không thể kích hoạt lại: Voucher đã hết hạn sử dụng (Ngày kết thúc: ${voucher.endDatetime.toLocaleString("vi-VN")}). Hãy gia hạn thêm thời gian kết thúc trước.`,
      400,
    );
  }
  if (voucher.totalLimit !== null && voucher.usedCount >= voucher.totalLimit) {
    throw new AppError(
      `Không thể kích hoạt lại: Voucher đã hết số lượt sử dụng (${voucher.usedCount}/${voucher.totalLimit})`,
      400,
    );
  }

  voucher.state = "Active";
  voucher.updatedBy = userId;
  voucher.changeLog.push({
    field: "state",
    oldValue: "Inactive",
    newValue: "Active",
    changedBy: userId,
    changedAt: now,
  });

  await voucher.save();
  return voucher;
};

/**
 * F-09: Archive Voucher (Expired/OutOfQuota -> Archived)
 */
export const archiveVoucher = async (id, userId) => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new AppError("Voucher not found", 404);

  if (!["Expired", "OutOfQuota"].includes(voucher.state)) {
    throw new AppError(
      "Chỉ có thể lưu trữ (Archive) các Voucher đã hết hạn hoặc hết lượt dùng",
      400,
    );
  }

  const now = new Date();
  const oldState = voucher.state;
  voucher.state = "Archived";
  voucher.updatedBy = userId;
  voucher.changeLog.push({
    field: "state",
    oldValue: oldState,
    newValue: "Archived",
    changedBy: userId,
    changedAt: now,
  });

  await voucher.save();
  return voucher;
};

/**
 * BR01: Auto-generate unique voucher code
 * Uppercase A-Z, 0-9, 8 characters
 */
export const generateVoucherCode = async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let exists = true;

  while (exists) {
    code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const found = await Voucher.findOne({ code });
    exists = !!found;
  }

  return code;
};

/**
 * Automatic state transitions (called by Cron Job)
 * - Upcoming -> Active (when current_time >= start_time)
 * - Active -> Expired (when current_time > end_time)
 * - Active -> OutOfQuota (when used_count >= total_limit)
 * - Inactive -> Expired (when current_time > end_time)
 */
export const autoTransitionVoucherStates = async () => {
  const now = new Date();
  const results = { activated: 0, expired: 0, outOfQuota: 0 };

  // Upcoming -> Active
  const activated = await Voucher.updateMany(
    { state: "Upcoming", startDatetime: { $lte: now } },
    {
      $set: { state: "Active" },
      $push: {
        changeLog: {
          field: "state",
          oldValue: "Upcoming",
          newValue: "Active",
          changedBy: null, // system
          changedAt: now,
          reason: "Auto-activated by system (start_time reached)",
        },
      },
    },
  );
  results.activated = activated.modifiedCount;

  // Active -> Expired
  const expiredActive = await Voucher.updateMany(
    { state: "Active", endDatetime: { $lt: now } },
    {
      $set: { state: "Expired" },
      $push: {
        changeLog: {
          field: "state",
          oldValue: "Active",
          newValue: "Expired",
          changedBy: null,
          changedAt: now,
          reason: "Auto-expired by system (end_time passed)",
        },
      },
    },
  );

  // Inactive -> Expired
  const expiredInactive = await Voucher.updateMany(
    { state: "Inactive", endDatetime: { $lt: now } },
    {
      $set: { state: "Expired" },
      $push: {
        changeLog: {
          field: "state",
          oldValue: "Inactive",
          newValue: "Expired",
          changedBy: null,
          changedAt: now,
          reason: "Auto-expired by system (end_time passed while Inactive)",
        },
      },
    },
  );
  results.expired = expiredActive.modifiedCount + expiredInactive.modifiedCount;

  // Active -> OutOfQuota
  const outOfQuota = await Voucher.updateMany(
    {
      state: "Active",
      totalLimit: { $ne: null },
      $expr: { $gte: ["$usedCount", "$totalLimit"] },
    },
    {
      $set: { state: "OutOfQuota" },
      $push: {
        changeLog: {
          field: "state",
          oldValue: "Active",
          newValue: "OutOfQuota",
          changedBy: null,
          changedAt: now,
          reason: "Auto-disabled by system (usage limit reached)",
        },
      },
    },
  );
  results.outOfQuota = outOfQuota.modifiedCount;

  return results;
};
