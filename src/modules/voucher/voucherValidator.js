/**
 * Voucher Validators - Chain of Responsibility Pattern
 * Each validator checks one condition and passes to the next
 */

import { VoucherUsageHistory } from "./voucherHistory.model.js";

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

    if (now < voucher.startDatetime) {
      return { valid: false, error: "Voucher chưa có hiệu lực", code: 400 };
    }
    if (now > voucher.endDatetime) {
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
    if (voucher.state !== "Active") {
      return {
        valid: false,
        error: "Voucher không trong trạng thái hoạt động",
        code: 400,
      };
    }
    return super.validate(context);
  }
}

/**
 * 4. Check canteen constraint (Global vs Branch)
 */
export class CanteenValidator extends VoucherValidator {
  async validate(context) {
    const { voucher, canteenId } = context;

    // If voucher.scope is Global, skip check
    if (voucher.scope === "Global") {
      return super.validate(context);
    }

    // If canteenId not provided in context, fail
    if (!canteenId) {
      return {
        valid: false,
        error: "Không xác định được Canteen của đơn hàng",
        code: 400,
      };
    }

    // Compare canteenIds
    if (
      !voucher.canteen_ids ||
      !voucher.canteen_ids.some((id) => id.toString() === canteenId.toString())
    ) {
      return {
        valid: false,
        error: "Voucher không áp dụng cho Canteen này",
        code: 400,
      };
    }

    return super.validate(context);
  }
}

/**
 * 5. Check global usage limit (usedCount < totalLimit)
 */
export class GlobalLimitValidator extends VoucherValidator {
  async validate(context) {
    const { voucher } = context;

    // totalLimit = null means unlimited
    if (
      voucher.totalLimit !== null &&
      voucher.usedCount >= voucher.totalLimit
    ) {
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

    // Count how many times this user has used this voucher without getting refunded
    const userUsageCount = await VoucherUsageHistory.countDocuments({
      voucherId: voucher._id,
      userId,
      voucherStatus: "Consumed",
    });

    if (userUsageCount >= voucher.usagePerUser) {
      return {
        valid: false,
        error: `Bạn đã sử dụng voucher này ${userUsageCount}/${voucher.usagePerUser} lần`,
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

    if (orderTotal < voucher.minOrderValue) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng voucher`,
        code: 400,
      };
    }
    // Also check item quantity if specified
    const totalQty = context.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (totalQty < voucher.minItemQuantity) {
      return {
        valid: false,
        error: `Đơn hàng cần tối thiểu ${voucher.minItemQuantity} sản phẩm để áp dụng voucher`,
        code: 400,
      };
    }

    return super.validate(context);
  }
}

/**
 * 8. Check if cart contains required products/categories based on application
 */
export class ProductValidator extends VoucherValidator {
  async validate(context) {
    const { voucher, items } = context;

    if (voucher.applyTo === "All items" || voucher.applyTo === "Combo only") {
      return super.validate(context);
    }

    if (voucher.applyTo === "Specific items") {
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
    }

    if (voucher.applyTo === "Category") {
      // NOTE: Context.items might need category info populated, or we skip deep validation for now
      // Assuming item.categoryId exists or we fetch it
      if (!voucher.categoryIds || voucher.categoryIds.length === 0) {
        return super.validate(context);
      }
      const categoryIdStrings = voucher.categoryIds.map((id) => id.toString());
      const hasMatchingCategory = items.some(
        (item) =>
          item.categoryId &&
          categoryIdStrings.includes(item.categoryId.toString()),
      );
      if (!hasMatchingCategory) {
        return {
          valid: false,
          error:
            "Giỏ hàng không có sản phẩm thuộc danh mục áp dụng voucher này",
          code: 400,
        };
      }
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
  const canteen = new CanteenValidator();
  const globalLimit = new GlobalLimitValidator();
  const userLimit = new UserLimitValidator();
  const minSpend = new MinSpendValidator();
  const product = new ProductValidator();

  // Chain them together
  existence
    .setNext(date)
    .setNext(active)
    .setNext(canteen)
    .setNext(globalLimit)
    .setNext(userLimit)
    .setNext(minSpend)
    .setNext(product);

  return existence;
}
