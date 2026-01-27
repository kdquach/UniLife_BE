/**
 * Voucher Validators - Chain of Responsibility Pattern
 * Each validator checks one condition and passes to the next
 */

import { VoucherUsage } from "./voucher.model.js";

/**
 * Base Validator class
 */
class VoucherValidator {
  constructor() {
    this.next = null;
  }

  setNext(validator) {
    this.next = validator;
    return validator;
  }

  async validate(context) {
    if (this.next) {
      return this.next.validate(context);
    }
    return { valid: true };
  }
}

/**
 * 1. Check if voucher exists
 */
export class ExistenceValidator extends VoucherValidator {
  async validate(context) {
    const { voucher } = context;
    if (!voucher) {
      return { valid: false, error: "Mã voucher không tồn tại", code: 404 };
    }
    return super.validate(context);
  }
}

/**
 * 2. Check if voucher is within valid date range
 */
export class DateValidator extends VoucherValidator {
  async validate(context) {
    const { voucher } = context;
    const now = new Date();

    if (now < voucher.startDate) {
      return { valid: false, error: "Voucher chưa có hiệu lực", code: 400 };
    }
    if (now > voucher.endDate) {
      return { valid: false, error: "Voucher đã hết hạn", code: 400 };
    }
    return super.validate(context);
  }
}

/**
 * 3. Check if voucher is active
 */
export class ActiveValidator extends VoucherValidator {
  async validate(context) {
    const { voucher } = context;
    if (!voucher.isActive) {
      return { valid: false, error: "Voucher đã bị vô hiệu hóa", code: 400 };
    }
    return super.validate(context);
  }
}

/**
 * 4. Check campus constraint (null = Global, otherwise must match)
 */
export class CampusValidator extends VoucherValidator {
  async validate(context) {
    const { voucher, campusId } = context;

    // If voucher.campusId is null -> Global voucher, skip check
    if (voucher.campusId === null) {
      return super.validate(context);
    }

    // If campusId not provided in context, fail
    if (!campusId) {
      return {
        valid: false,
        error: "Không xác định được Campus của đơn hàng",
        code: 400,
      };
    }

    // Compare campusIds
    if (voucher.campusId.toString() !== campusId.toString()) {
      return {
        valid: false,
        error: "Voucher không áp dụng cho Campus này",
        code: 400,
      };
    }

    return super.validate(context);
  }
}

/**
 * 5. Check global usage limit (usedCount < maxUsage)
 */
export class GlobalLimitValidator extends VoucherValidator {
  async validate(context) {
    const { voucher } = context;

    // maxUsage = null means unlimited
    if (voucher.maxUsage !== null && voucher.usedCount >= voucher.maxUsage) {
      return { valid: false, error: "Voucher đã hết lượt sử dụng", code: 400 };
    }
    return super.validate(context);
  }
}

/**
 * 6. Check per-user usage limit
 */
export class UserLimitValidator extends VoucherValidator {
  async validate(context) {
    const { voucher, userId } = context;

    if (!userId) {
      return {
        valid: false,
        error: "Vui lòng đăng nhập để sử dụng voucher",
        code: 401,
      };
    }

    // Count how many times this user has used this voucher
    const userUsageCount = await VoucherUsage.countDocuments({
      voucherId: voucher._id,
      userId,
    });

    if (userUsageCount >= voucher.userUsageLimit) {
      return {
        valid: false,
        error: `Bạn đã sử dụng voucher này ${userUsageCount}/${voucher.userUsageLimit} lần`,
        code: 400,
      };
    }

    return super.validate(context);
  }
}

/**
 * 7. Check minimum order amount
 */
export class MinSpendValidator extends VoucherValidator {
  async validate(context) {
    const { voucher, orderTotal } = context;

    if (orderTotal < voucher.minOrderAmount) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString("vi-VN")}đ để áp dụng voucher`,
        code: 400,
      };
    }
    return super.validate(context);
  }
}

/**
 * 8. Check if cart contains required products (for specific_products vouchers)
 */
export class ProductValidator extends VoucherValidator {
  async validate(context) {
    const { voucher, items } = context;

    // Skip if applyTo is 'all'
    if (voucher.applyTo === "all") {
      return super.validate(context);
    }

    // Check if any item in cart matches productIds
    if (!voucher.productIds || voucher.productIds.length === 0) {
      return super.validate(context);
    }

    const productIdStrings = voucher.productIds.map((id) => id.toString());
    const hasMatchingProduct = items.some((item) =>
      productIdStrings.includes(item.productId.toString()),
    );

    if (!hasMatchingProduct) {
      return {
        valid: false,
        error: "Giỏ hàng không có sản phẩm áp dụng voucher này",
        code: 400,
      };
    }

    return super.validate(context);
  }
}

/**
 * Build the validation chain
 * @returns {ExistenceValidator} The first validator in the chain
 */
export function buildValidationChain() {
  const existence = new ExistenceValidator();
  const date = new DateValidator();
  const active = new ActiveValidator();
  const campus = new CampusValidator();
  const globalLimit = new GlobalLimitValidator();
  const userLimit = new UserLimitValidator();
  const minSpend = new MinSpendValidator();
  const product = new ProductValidator();

  // Chain them together
  existence
    .setNext(date)
    .setNext(active)
    .setNext(campus)
    .setNext(globalLimit)
    .setNext(userLimit)
    .setNext(minSpend)
    .setNext(product);

  return existence;
}
