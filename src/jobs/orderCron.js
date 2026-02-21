import cron from "node-cron";
import { autoCancelExpiredOrders } from "../modules/order/order.service.js";

/**
 * Register order-related cron jobs
 * - Auto-cancel expired ready orders: runs every 15 minutes
 */
export const registerOrderCronJobs = () => {
  // Run every 15 minutes to check for expired orders
  cron.schedule("*/15 * * * *", async () => {
    try {
      const result = await autoCancelExpiredOrders();
      if (result.totalCancelled > 0) {
        console.log(
          `[Cron] Đã tự động hủy ${result.totalCancelled} đơn hàng quá hạn lúc ${result.timestamp.toISOString()}`,
        );
      }
    } catch (error) {
      console.error("[Cron] Lỗi khi hủy đơn hàng quá hạn:", error.message);
    }
  });

  console.log(
    "[Cron] Order cron jobs registered: auto-cancel every 15 minutes",
  );
};
