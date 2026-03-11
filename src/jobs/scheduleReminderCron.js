import cron from "node-cron";
import User from "../modules/user/user.model.js";
import { StaffShift } from "../modules/staffShift/staffShift.model.js";
import { Notification } from "../modules/notification/notification.model.js";
import { createNotification } from "../modules/notification/notification.service.js";
import { notifyUser } from "../websocket/notify.js";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function getNextWeekRange(now = new Date()) {
  const base = startOfDay(now);
  const day = base.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() + daysUntilNextMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

async function hasSentToday({ managerId, weekStart, reminderType }) {
  return Notification.exists({
    userId: managerId,
    type: "shift",
    "metadata.kind": "manager_schedule_reminder",
    "metadata.weekStart": weekStart.toISOString().slice(0, 10),
    "metadata.reminderType": reminderType,
    createdAt: {
      $gte: startOfDay(),
      $lte: endOfDay(),
    },
  });
}

async function sendReminderToManagers(reminderType) {
  const managers = await User.find({
    role: "manager",
    status: "active",
  })
    .select("_id canteenId fullName")
    .lean();

  if (!managers.length) return;

  const managersByCanteen = new Map();
  for (const manager of managers) {
    const canteenKey = manager.canteenId ? String(manager.canteenId) : "null";
    const current = managersByCanteen.get(canteenKey) || [];
    current.push(manager);
    managersByCanteen.set(canteenKey, current);
  }

  const { weekStart, weekEnd } = getNextWeekRange();

  for (const [canteenKey, canteenManagers] of managersByCanteen.entries()) {
    const canteenId = canteenKey === "null" ? null : canteenKey;

    const staffCount = await User.countDocuments({
      role: "staff",
      status: "active",
      ...(canteenId ? { canteenId } : {}),
    });

    if (!staffCount) continue;

    const assignedCount = await StaffShift.countDocuments({
      isDeleted: { $ne: true },
      status: { $in: ["assigned", "scheduled"] },
      date: { $gte: weekStart, $lte: weekEnd },
      ...(canteenId ? { canteenId } : {}),
    });

    if (assignedCount > 0) continue;

    for (const manager of canteenManagers) {
      const alreadySent = await hasSentToday({
        managerId: manager._id,
        weekStart,
        reminderType,
      });
      if (alreadySent) continue;

      const notification = await createNotification({
        userId: manager._id,
        canteenId: canteenId || null,
        type: "shift",
        title: "Nhắc xếp lịch cho nhân viên",
        content:
          reminderType === "thursday"
            ? "Hôm nay là Thứ 5, vui lòng xếp lịch tuần tới cho nhân viên."
            : "Hôm nay là Thứ 6, lịch tuần tới vẫn chưa được xếp. Vui lòng hoàn tất sớm.",
        metadata: {
          kind: "manager_schedule_reminder",
          reminderType,
          weekStart: weekStart.toISOString().slice(0, 10),
          weekEnd: weekEnd.toISOString().slice(0, 10),
        },
      });

      try {
        notifyUser(String(manager._id), {
          id: String(notification._id),
          title: notification.title,
          content: notification.content,
          type: "shift",
          isRead: false,
          createdAt: notification.createdAt,
          meta: {
            ...(notification.metadata || {}),
            notificationId: String(notification._id),
          },
        });
      } catch {
        // Ignore websocket failures
      }
    }
  }
}

export const registerScheduleReminderCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      const day = new Date().getDay();

      if (day === 4) {
        await sendReminderToManagers("thursday");
      }

      if (day === 5) {
        await sendReminderToManagers("friday");
      }
    } catch (error) {
      console.error("[Cron] Lỗi khi gửi nhắc xếp lịch:", error.message);
    }
  });

  console.log("[Cron] Schedule reminder cron registered: daily at 09:00 (Thu/Fri)");
};