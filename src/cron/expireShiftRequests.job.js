import cron from "node-cron";
import { expirePendingShiftChangeRequests } from "../modules/shift/shift.service.js";

export const registerExpireShiftChangeRequestCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const updatedCount = await expirePendingShiftChangeRequests();
      console.log("[CRON] Expired shift change requests:", updatedCount);
    } catch (error) {
      console.error("[CRON] Lỗi expire shift change requests:", error.message);
    }
  });

  console.log("[CRON] Shift change request expire cron registered: 0 0 * * *");
};
