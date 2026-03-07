import cron from "node-cron";
import { autoTransitionVoucherStates } from "../modules/voucher/voucher.service.js";

/**
 * Register voucher-related cron jobs
 * - Auto state transitions: runs every 5 minutes
 *   - Upcoming -> Active (when start_time is reached)
 *   - Active -> Expired (when end_time has passed)
 *   - Active -> OutOfQuota (when usage limit reached)
 *   - Inactive -> Expired (when end_time has passed)
 */
export const registerVoucherCronJobs = () => {
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const results = await autoTransitionVoucherStates();
      const total = results.activated + results.expired + results.outOfQuota;
      if (total > 0) {
        console.log(
          `[Cron][Voucher] State transitions: ${results.activated} activated, ${results.expired} expired, ${results.outOfQuota} out-of-quota at ${new Date().toISOString()}`,
        );
      }
    } catch (error) {
      console.error(
        "[Cron][Voucher] Error during state transitions:",
        error.message,
      );
    }
  });

  console.log(
    "[Cron] Voucher cron jobs registered: auto state transition every 5 minutes",
  );
};
