import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import { Shift } from "../shift/shift.model.js";
import { StaffShift } from "../staffShift/staffShift.model.js";
import { Schedule } from "./schedule.model.js";
import { createNotification } from "../notification/notification.service.js";
import { notifyUser } from "../../websocket/notify.js";

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("weekStart không hợp lệ", 400);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const normalizeWeekStartOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("weekStart không hợp lệ", 400);
  }

  // Chuẩn hóa weekStart theo UTC để tránh lệch ngày giữa môi trường/FE.
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const normalizeObjectIdLike = (value) => {
  if (!value) return value;
  return value?._id || value;
};

const getUtcDayRange = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("weekStart không hợp lệ", 400);
  }

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

const getLocalDayRange = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("weekStart không hợp lệ", 400);
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const notifyPublishedSchedule = async ({ scheduleId, canteenId, weekStart }) => {
  const staffIds = await StaffShift.find({
    scheduleId,
    isDeleted: { $ne: true },
    status: { $in: ["scheduled", "checked_in", "checked_out"] },
  }).distinct("staffId");

  if (!staffIds.length) {
    return;
  }

  const weekStartLabel = new Date(weekStart).toISOString().slice(0, 10);

  for (const staffId of staffIds) {
    const notification = await createNotification({
      userId: staffId,
      canteenId: canteenId || null,
      type: "shift",
      title: "Lịch làm việc mới đã được phát hành",
      content: `Quản lý vừa phát hành lịch làm việc tuần ${weekStartLabel}.`,
      metadata: {
        kind: "schedule_published",
        scheduleId,
        weekStart: weekStartLabel,
      },
    });

    try {
      notifyUser(String(staffId), {
        id: String(notification._id),
        title: notification.title,
        content: notification.content,
        type: notification.type,
        isRead: false,
        createdAt: notification.createdAt,
        meta: {
          ...(notification.metadata || {}),
          notificationId: String(notification._id),
        },
      });
    } catch {
      // Bỏ qua lỗi websocket để không ảnh hưởng publish flow.
    }
  }
};

const getStartOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getEndOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const buildDateTimeFromShift = (dateValue, startTime) => {
  const [hours, minutes] = String(startTime || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const date = new Date(dateValue);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const resolveCanteenId = (currentUser, requestedCanteenId = null) => {
  if (!currentUser) {
    throw new AppError("Không tìm thấy thông tin người dùng", 401);
  }

  if (currentUser.role === "admin") {
    if (!requestedCanteenId) {
      throw new AppError("Admin cần truyền canteenId", 400);
    }
    return normalizeObjectIdLike(requestedCanteenId);
  }

  if (!currentUser.canteenId) {
    throw new AppError("Tài khoản chưa được gán canteen", 400);
  }

  return normalizeObjectIdLike(currentUser.canteenId);
};

const validateAssignmentsPayload = (assignments = []) => {
  if (!Array.isArray(assignments) || !assignments.length) {
    throw new AppError("Danh sách phân công không được rỗng", 400);
  }

  assignments.forEach((item, index) => {
    if (!item?.staffId || !item?.shiftId || !item?.date) {
      throw new AppError(`Phân công tại vị trí ${index + 1} thiếu staffId/shiftId/date`, 400);
    }
  });
};

const validateAndNormalizeAssignments = ({
  assignments = [],
  canteenId,
  shifts = [],
}) => {
  const now = new Date();
  const today = getStartOfDay(now);
  const shiftMap = new Map(shifts.map((item) => [String(item._id), item]));

  const duplicateKeySet = new Set();
  const staffDailyIntervals = new Map();
  const shiftDailyCount = new Map();

  const normalizedAssignments = [];
  let ignoredAssignments = 0;

  assignments.forEach((item, index) => {
    const shift = shiftMap.get(String(item.shiftId));
    if (!shift) {
      throw new AppError(`shiftId không hợp lệ ở vị trí ${index + 1}`, 400);
    }

    // Chặn gán ca khác canteen với schedule.
    if (String(shift.canteenId) !== String(canteenId)) {
      throw new AppError(`shiftId ở vị trí ${index + 1} không thuộc canteen hiện tại`, 400);
    }

    const normalizedDate = normalizeDateOnly(item.date);
    // Bỏ qua ca quá khứ để vẫn có thể lưu/publish tuần hiện tại.
    if (normalizedDate < today) {
      ignoredAssignments += 1;
      return;
    }

    const startMinutes = timeToMinutes(shift.startTime);
    const endMinutes = timeToMinutes(shift.endTime);
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      throw new AppError(`Khung giờ shift không hợp lệ ở vị trí ${index + 1}`, 400);
    }

    const shiftStartAt = buildDateTimeFromShift(normalizedDate, shift.startTime);
    // Bỏ qua ca đã bắt đầu để tránh chặn toàn bộ payload khi FE gửi cả tuần.
    if (!shiftStartAt || shiftStartAt <= now) {
      ignoredAssignments += 1;
      return;
    }

    const dateKey = normalizedDate.toISOString();
    const duplicateKey = `${item.staffId}:${item.shiftId}:${dateKey}`;
    if (duplicateKeySet.has(duplicateKey)) {
      throw new AppError(`Nhân viên bị gán trùng ca tại vị trí ${index + 1}`, 400);
    }
    duplicateKeySet.add(duplicateKey);

    const shiftDateKey = `${item.shiftId}:${dateKey}`;
    const nextShiftCount = (shiftDailyCount.get(shiftDateKey) || 0) + 1;
    if (nextShiftCount > Number(shift.maxStaff || 0)) {
      throw new AppError(`Vượt số lượng nhân sự tối đa của ca tại vị trí ${index + 1}`, 400);
    }
    shiftDailyCount.set(shiftDateKey, nextShiftCount);

    const staffDateKey = `${item.staffId}:${dateKey}`;
    const existingIntervals = staffDailyIntervals.get(staffDateKey) || [];
    const hasOverlap = existingIntervals.some((interval) => {
      return rangesOverlap(startMinutes, endMinutes, interval.startMinutes, interval.endMinutes);
    });

    if (hasOverlap) {
      throw new AppError(`Nhân viên bị trùng giờ làm ở vị trí ${index + 1}`, 400);
    }

    existingIntervals.push({ startMinutes, endMinutes });
    staffDailyIntervals.set(staffDateKey, existingIntervals);

    normalizedAssignments.push({
      staffId: item.staffId,
      shiftId: item.shiftId,
      date: normalizedDate,
    });
  });

  if (!normalizedAssignments.length) {
    throw new AppError("Không có phân công hợp lệ từ thời điểm hiện tại để lưu lịch", 400);
  }

  return {
    normalizedAssignments,
    savedAssignments: normalizedAssignments.length,
    ignoredAssignments,
  };
};

const createScheduleDraft = async (payload = {}, currentUser = null) => {
  const weekStart = normalizeWeekStartOnly(payload.weekStart);
  const canteenId = resolveCanteenId(currentUser, payload.canteenId);
  const assignments = payload.assignments || [];

  validateAssignmentsPayload(assignments);

  const shiftIds = [...new Set(assignments.map((item) => String(item.shiftId)))];
  const shifts = await Shift.find({
    _id: { $in: shiftIds },
    isDeleted: { $ne: true },
    status: "active",
  }).select("_id canteenId startTime endTime maxStaff");

  if (shifts.length !== shiftIds.length) {
    throw new AppError("Có shiftId không hợp lệ hoặc đã bị xóa", 400);
  }

  const {
    normalizedAssignments,
    savedAssignments,
    ignoredAssignments,
  } = validateAndNormalizeAssignments({
    assignments,
    canteenId,
    shifts,
  });

  const latest = await Schedule.findOne({ canteenId, weekStart }).sort({ version: -1 });

  const session = await mongoose.startSession();
  let createdSchedule = null;

  try {
    await session.withTransaction(async () => {
      const [scheduleDoc] = await Schedule.create([
        {
          canteenId,
          weekStart,
          version: (latest?.version || 0) + 1,
          status: "draft",
          createdBy: currentUser._id,
        },
      ], { session });

      createdSchedule = scheduleDoc;

      const docs = normalizedAssignments.map((item) => ({
        scheduleId: createdSchedule._id,
        scheduleVersion: createdSchedule.version,
        staffId: item.staffId,
        shiftId: item.shiftId,
        date: item.date,
        assignedBy: currentUser._id,
        canteenId,
        status: "scheduled",
      }));

      try {
        await StaffShift.insertMany(docs, { session });
      } catch (error) {
        if (error?.code === 11000) {
          throw new AppError(
            "Dữ liệu phân ca bị trùng theo ràng buộc cũ (shiftId/staffId/date). Vui lòng kiểm tra ca đã tồn tại hoặc chạy migrate index.",
            400,
          );
        }
        throw error;
      }
    });
  } finally {
    session.endSession();
  }

  return {
    schedule: createdSchedule,
    savedAssignments,
    ignoredAssignments,
  };
};

const publishSchedule = async (scheduleId, currentUser = null) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new AppError("Không tìm thấy lịch để publish", 404);
  }

  const canteenId = resolveCanteenId(currentUser, schedule.canteenId);
  if (String(canteenId) !== String(schedule.canteenId)) {
    throw new AppError("Không có quyền publish lịch của canteen khác", 403);
  }

  if (schedule.status !== "draft") {
    throw new AppError("Chỉ được publish lịch ở trạng thái draft", 400);
  }

  const session = await mongoose.startSession();
  let published = null;

  await session.withTransaction(async () => {
    // Đảm bảo lịch draft có phân công trước khi publish.
    const assignmentCount = await StaffShift.countDocuments({
      scheduleId: schedule._id,
      isDeleted: { $ne: true },
      status: { $ne: "cancelled" },
    }).session(session);

    if (!assignmentCount) {
      throw new AppError("Không thể publish lịch rỗng", 400);
    }

    await Schedule.updateMany(
      {
        canteenId: schedule.canteenId,
        weekStart: schedule.weekStart,
        status: "published",
        _id: { $ne: schedule._id },
      },
      {
        $set: {
          status: "archived",
        },
      },
      { session },
    );

    published = await Schedule.findByIdAndUpdate(
      schedule._id,
      {
        $set: {
          status: "published",
          publishedAt: new Date(),
        },
      },
      { new: true, session },
    );

    const publishedCount = await Schedule.countDocuments({
      canteenId: schedule.canteenId,
      weekStart: schedule.weekStart,
      status: "published",
    }).session(session);

    if (publishedCount > 1) {
      throw new AppError("Dữ liệu publish bị xung đột phiên bản", 409);
    }
  });

  session.endSession();

  // Gửi thông báo sau khi transaction thành công để staff nhận lịch mới.
  await notifyPublishedSchedule({
    scheduleId: published._id,
    canteenId: published.canteenId,
    weekStart: published.weekStart,
  });

  return published;
};

const getPublishedSchedule = async (query = {}, currentUser = null) => {
  const weekStartRange = query.weekStart ? getUtcDayRange(query.weekStart) : null;
  const weekStartLocalRange = query.weekStart ? getLocalDayRange(query.weekStart) : null;
  const canteenId = resolveCanteenId(currentUser, query.canteenId);

  const schedule = await Schedule.findOne({
    canteenId,
    status: "published",
    ...(weekStartRange
      ? {
        // Hỗ trợ cả dữ liệu weekStart lưu theo UTC và dữ liệu legacy lưu theo local.
        $or: [
          {
            weekStart: {
              $gte: weekStartRange.start,
              $lte: weekStartRange.end,
            },
          },
          {
            weekStart: {
              $gte: weekStartLocalRange.start,
              $lte: weekStartLocalRange.end,
            },
          },
        ],
      }
      : {}),
  }).sort({ updatedAt: -1, version: -1, weekStart: -1 });

  if (!schedule) {
    throw new AppError("Không có lịch đã publish", 404);
  }

  const assignments = await StaffShift.find({
    scheduleId: schedule._id,
    isDeleted: { $ne: true },
  })
    .populate("shiftId", "name startTime endTime")
    .populate("staffId", "fullName email")
    .populate("canteenId", "name location")
    .sort({ date: 1 });

  return {
    schedule,
    assignments,
  };
};

const getDraftSchedule = async (query = {}, currentUser = null) => {
  const weekStartRange = query.weekStart ? getUtcDayRange(query.weekStart) : null;
  const weekStartLocalRange = query.weekStart ? getLocalDayRange(query.weekStart) : null;
  const canteenId = resolveCanteenId(currentUser, query.canteenId);

  const schedule = await Schedule.findOne({
    canteenId,
    status: "draft",
    ...(weekStartRange
      ? {
        // Hỗ trợ cả dữ liệu weekStart lưu theo UTC và dữ liệu legacy lưu theo local.
        $or: [
          {
            weekStart: {
              $gte: weekStartRange.start,
              $lte: weekStartRange.end,
            },
          },
          {
            weekStart: {
              $gte: weekStartLocalRange.start,
              $lte: weekStartLocalRange.end,
            },
          },
        ],
      }
      : {}),
  }).sort({ updatedAt: -1, version: -1, weekStart: -1 });

  if (!schedule) {
    return {
      schedule: null,
      assignments: [],
    };
  }

  const assignments = await StaffShift.find({
    scheduleId: schedule._id,
    isDeleted: { $ne: true },
  })
    .populate("shiftId", "name startTime endTime")
    .populate("staffId", "fullName email")
    .populate("canteenId", "name location")
    .sort({ date: 1 });

  return {
    schedule,
    assignments,
  };
};

export default {
  createScheduleDraft,
  publishSchedule,
  getPublishedSchedule,
  getDraftSchedule,
};
