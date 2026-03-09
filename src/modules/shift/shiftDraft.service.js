import { Shift, StaffShift } from "./shift.model.js";
import { DraftShiftAssignment } from "./draftShiftAssignment.model.js";
import AppError from "../../utils/AppError.js";
import { createNotification } from "../notification/notification.service.js";
import { notifyUser } from "../../websocket/notify.js";
import {
  ensureRoleHasCanteen,
  getWeekRange,
  normalizeDateOnly,
  startOfDay,
  validateNotExecutedStatus,
  validateNotPastDate,
  validatePublishRange,
  validateShiftOverlap,
} from "./shiftValidation.js";

const getCanteenScope = (currentUser) => {
  ensureRoleHasCanteen(currentUser);

  if (currentUser?.canteenId) {
    return String(currentUser.canteenId);
  }

  throw new AppError("Không xác định được canteen", 400);
};

const getDraftFilter = (weekStart, currentUser) => {
  const canteenId = getCanteenScope(currentUser);
  const weekStartDate = startOfDay(weekStart);
  return {
    canteenId,
    weekStart: weekStartDate,
  };
};

const loadDraftWithPopulate = async (filter) => {
  return DraftShiftAssignment.find(filter)
    .populate("shiftId", "name startTime endTime")
    .populate("staffId", "fullName email")
    .sort({ date: 1, shiftId: 1, staffId: 1 });
};

export const getWeeklyDraft = async (weekStart, currentUser = null) => {
  const filter = getDraftFilter(weekStart, currentUser);
  const { start, end } = getWeekRange(filter.weekStart);

  const existingDraft = await loadDraftWithPopulate(filter);
  if (existingDraft.length) {
    return existingDraft;
  }

  const sourceAssignments = await StaffShift.find({
    canteenId: filter.canteenId,
    isDeleted: { $ne: true },
    date: { $gte: start, $lte: end },
    status: { $in: ["scheduled", "checked_in", "checked_out", "absent"] },
  }).select("shiftId staffId canteenId date");

  if (sourceAssignments.length) {
    const draftDocs = sourceAssignments.map((item) => ({
      shiftId: item.shiftId,
      staffId: item.staffId,
      canteenId: item.canteenId,
      date: normalizeDateOnly(item.date),
      weekStart: filter.weekStart,
      createdBy: currentUser?._id,
    }));

    await DraftShiftAssignment.insertMany(draftDocs, { ordered: false });
  }

  return loadDraftWithPopulate(filter);
};

export const saveWeeklyDraft = async (
  assignments = [],
  weekStart,
  currentUser = null,
) => {
  const filter = getDraftFilter(weekStart, currentUser);
  const { start, end } = getWeekRange(filter.weekStart);

  const validAssignments = Array.isArray(assignments) ? assignments : [];
  const shiftIds = [...new Set(validAssignments.map((item) => String(item?.shiftId || "")).filter(Boolean))];

  const shifts = await Shift.find({
    _id: { $in: shiftIds },
    isDeleted: { $ne: true },
  }).select("_id canteenId startTime endTime");

  const shiftMap = new Map(shifts.map((item) => [String(item._id), item]));
  const normalized = [];

  for (const item of validAssignments) {
    if (!item?.shiftId || !item?.staffId || !item?.date) {
      throw new AppError("Thiếu dữ liệu phân ca", 400);
    }

    const shift = shiftMap.get(String(item.shiftId));
    if (!shift) {
      throw new AppError("Ca làm không tồn tại", 404);
    }

    if (String(shift.canteenId) !== String(filter.canteenId)) {
      throw new AppError("Ca làm không thuộc canteen hiện tại", 400);
    }

    const dateOnly = normalizeDateOnly(item.date);
    if (dateOnly < start || dateOnly > end) {
      throw new AppError("Ngày phân ca không thuộc tuần hiện tại", 400);
    }

    validateNotPastDate(dateOnly);

    const executed = await StaffShift.findOne({
      shiftId: item.shiftId,
      staffId: item.staffId,
      date: dateOnly,
      canteenId: filter.canteenId,
      isDeleted: { $ne: true },
      status: { $in: ["checked_in", "checked_out", "absent"] },
    }).select("status");

    if (executed?.status) {
      validateNotExecutedStatus(executed.status);
    }

    normalized.push({
      shiftId: item.shiftId,
      staffId: item.staffId,
      date: dateOnly,
      canteenId: filter.canteenId,
      weekStart: filter.weekStart,
      createdBy: currentUser?._id,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  }

  validateShiftOverlap(normalized);

  await DraftShiftAssignment.deleteMany(filter);

  if (normalized.length) {
    await DraftShiftAssignment.insertMany(
      normalized.map(({ startTime, endTime, ...doc }) => doc),
      { ordered: false },
    );
  }

  return loadDraftWithPopulate(filter);
};

export const cancelWeeklyDraft = async (weekStart, currentUser = null) => {
  const filter = getDraftFilter(weekStart, currentUser);
  const result = await DraftShiftAssignment.deleteMany(filter);

  return {
    deletedCount: result.deletedCount || 0,
  };
};

export const publishWeeklyDraft = async (weekStart, currentUser = null) => {
  const filter = getDraftFilter(weekStart, currentUser);
  validatePublishRange(filter.weekStart);

  const { start, end } = getWeekRange(filter.weekStart);
  const today = startOfDay(new Date());

  const draftAssignments = await DraftShiftAssignment.find(filter)
    .populate("shiftId", "startTime endTime")
    .select("shiftId staffId date canteenId weekStart createdBy");

  if (!draftAssignments.length) {
    throw new AppError("Không có dữ liệu nháp để phát hành", 400);
  }

  const normalized = draftAssignments.map((item) => ({
    shiftId: item.shiftId?._id || item.shiftId,
    staffId: item.staffId,
    date: normalizeDateOnly(item.date),
    startTime: item.shiftId?.startTime,
    endTime: item.shiftId?.endTime,
  }));

  for (const item of normalized) {
    validateNotPastDate(item.date);
  }

  validateShiftOverlap(normalized);

  const deleteFilter = {
    canteenId: filter.canteenId,
    isDeleted: { $ne: true },
    date: {
      $gte: start > today ? start : today,
      $lte: end,
    },
    status: { $nin: ["checked_in", "checked_out", "absent"] },
  };

  const deleteResult = await StaffShift.deleteMany(deleteFilter);

  const publishPayload = draftAssignments
    .filter((item) => normalizeDateOnly(item.date) >= today)
    .map((item) => ({
      shiftId: item.shiftId?._id || item.shiftId,
      staffId: item.staffId,
      canteenId: item.canteenId,
      date: normalizeDateOnly(item.date),
      status: "scheduled",
      publishedAt: new Date(),
      assignedBy: currentUser?._id || item.createdBy || null,
    }));

  let insertedCount = 0;
  if (publishPayload.length) {
    const inserted = await StaffShift.insertMany(publishPayload, { ordered: false });
    insertedCount = inserted.length;
  }

  await DraftShiftAssignment.deleteMany(filter);

  const notifiedStaffIds = new Set();
  for (const item of publishPayload) {
    const staffId = String(item.staffId || "");
    if (!staffId || notifiedStaffIds.has(staffId)) continue;

    notifiedStaffIds.add(staffId);

    const notification = await createNotification({
      userId: item.staffId,
      canteenId: item.canteenId,
      type: "shift",
      title: "Lịch làm việc đã được cập nhật",
      content: "Quản lý vừa publish lịch làm việc mới. Vui lòng kiểm tra lịch của bạn.",
      metadata: {
        kind: "schedule_published",
        weekStart: filter.weekStart,
      },
    });

    try {
      notifyUser(String(item.staffId), {
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

  return {
    deletedCount: deleteResult.deletedCount || 0,
    insertedCount,
    notifiedCount: notifiedStaffIds.size,
  };
};
