/**
 * Discount Calculator - Strategy Pattern
 * Different strategies for calculating discount based on voucher type
 */

/**
 * Base Strategy interface
 */
class DiscountStrategy {
  calculate(voucher, orderTotal, items) {
    throw new Error("calculate() must be implemented by subclass");
  }
}

/**
 * Fixed discount strategy (e.g., 20,000 VND off)
 */
export class FixedDiscountStrategy extends DiscountStrategy {
  calculate(voucher, orderTotal, items) {
    // Fixed discount cannot exceed order total
    return Math.min(voucher.discountValue, orderTotal);
  }
}

/**
 * Percentage discount strategy (e.g., 10% off, max 50,000 VND)
 */
export class PercentageDiscountStrategy extends DiscountStrategy {
  calculate(voucher, orderTotal, items) {
    let discount = (orderTotal * voucher.discountValue) / 100;

    // Apply maxDiscount cap if set
    if (voucher.maxDiscountCap) {
      discount = Math.min(discount, voucher.maxDiscountCap);
    }

    // Cannot exceed order total
    return Math.min(discount, orderTotal);
  }
}

/**
 * Discount Calculator - uses strategy based on voucher type
 */
export class DiscountCalculator {
  constructor() {
    this.strategies = {
      "Fixed Amount": new FixedDiscountStrategy(),
      Percentage: new PercentageDiscountStrategy(),
    };
  }

  /**
   * Calculate discount amount
   * @param {Object} voucher - The voucher document
   * @param {number} orderTotal - Total order amount
   * @param {Array} items - Cart items (for specific calculation)
   * @returns {number} Discount amount
   */
  calculate(voucher, orderTotal, items = []) {
    const strategy = this.strategies[voucher.discountType];

    if (!strategy) {
      console.warn(`Unknown discount type: ${voucher.discountType}`);
      return 0;
    }

    // If applyTo is Specific items, calculate based on matching items only
    if (
      voucher.applyTo === "Specific items" &&
      voucher.productIds?.length > 0
    ) {
      const productIdStrings = voucher.productIds.map((id) => id.toString());

      // Calculate subtotal of applicable items
      const applicableTotal = items.reduce((sum, item) => {
        if (productIdStrings.includes(item.productId.toString())) {
          return sum + item.price * item.quantity;
        }
        return sum;
      }, 0);

      // Apply discount only to applicable items
      return strategy.calculate(voucher, applicableTotal, items);
    }

    // If applyTo is Category, calculate based on matching categories only
    if (voucher.applyTo === "Category" && voucher.categoryIds?.length > 0) {
      const categoryIdStrings = voucher.categoryIds.map((id) => id.toString());

      // Calculate subtotal of applicable items
      const applicableTotal = items.reduce((sum, item) => {
        if (
          item.categoryId &&
          categoryIdStrings.includes(item.categoryId.toString())
        ) {
          return sum + item.price * item.quantity;
        }
        return sum;
      }, 0);

      // Apply discount only to applicable items
      return strategy.calculate(voucher, applicableTotal, items);
    }

    // Default (All items, Combo only): apply to full order
    return strategy.calculate(voucher, orderTotal, items);
  }
}

// Export singleton instance
export const discountCalculator = new DiscountCalculator();
