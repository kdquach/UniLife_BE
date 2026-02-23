import { Shift, StaffShift } from "./shift.model.js";
import AppError from "../../utils/AppError.js";
import { ShiftChangeRequest } from "./shiftChangeRequest.model.js";
import User from "../user/user.model.js";
import { createNotification } from "../notification/notification.service.js";
import { notifyUser } from "../../websocket/notify.js";

function normalizeDateOnly(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function isWeekend(date = new Date()) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

const validateAssignmentOverlap = async ({
  staffId,
  canteenId,
  date,
  shift,
  excludeAssignmentId = null,
}) => {
  const normalizedDate = normalizeDateOnly(date);
  const dayStart = new Date(normalizedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(normalizedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const nextStart = timeToMinutes(shift?.startTime);
  const nextEnd = timeToMinutes(shift?.endTime);
  if (nextStart === null || nextEnd === null) {
    throw new AppError("Shift time is invalid", 400);
  }

  const existingAssignments = await StaffShift.find({
    staffId,
    canteenId,
    isDeleted: { $ne: true },
    date: {
      $gte: dayStart,
      $lte: dayEnd,
    },
    ...(excludeAssignmentId ? { _id: { $ne: excludeAssignmentId } } : {}),
  }).populate("shiftId", "startTime endTime");

  const hasConflict = existingAssignments.some((assignment) => {
    const currentStart = timeToMinutes(assignment?.shiftId?.startTime);
    const currentEnd = timeToMinutes(assignment?.shiftId?.endTime);
    if (currentStart === null || currentEnd === null) return false;
    return rangesOverlap(nextStart, nextEnd, currentStart, currentEnd);
  });

  if (hasConflict) {
    throw new AppError("Staff has overlapping shift assignment", 400);
  }
};

// ============ Shift Services ============

/**
 * Create a new shift
 * @param {Object} shiftData - Shift data
 * @returns {Promise<Object>} Created shift
 */
export const createShift = async (shiftData) => {
  const shift = await Shift.create(shiftData);
  return shift;
};

/**
 * Get all shifts
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Array of shifts
 */
export const getAllShifts = async (query = {}) => {
  const filter = { isDeleted: { $ne: true } };

  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const shifts = await Shift.find(filter)
    .populate("canteenId", "name location")
    .sort({ name: 1 });

  return shifts;
};

/**
 * Get shift by ID
 * @param {string} id - Shift ID
 * @returns {Promise<Object>} Shift object
 */
export const getShiftById = async (id) => {
  const shift = await Shift.findOne({
    _id: id,
    isDeleted: { $ne: true },
  }).populate("canteenId", "name location");

  if (!shift) {
    throw new AppError("Shift not found", 404);
  }
  return shift;
};

/**
 * Update shift
 * @param {string} id - Shift ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated shift
 */
export const updateShift = async (id, updateData) => {
  const shift = await Shift.findOneAndUpdate({
    _id: id,
    isDeleted: { $ne: true },
  }, {
    $set: updateData,
    $inc: { version: 1 },
  }, {
    new: true,
    runValidators: true,
  });

  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  return shift;
};

/**
 * Delete shift
 * @param {string} id - Shift ID
 */
export const deleteShift = async (id) => {
  const shift = await Shift.findOneAndDelete({
    _id: id,
    isDeleted: { $ne: true },
  });
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  // Also delete all assignments for this shift
  await StaffShift.deleteMany({ shiftId: id, isDeleted: { $ne: true } });
};

// ============ Staff Shift Assignment Services ============

/**
 * Assign user to shift on a specific date
 * @param {Object} assignmentData - Assignment data
 * @returns {Promise<Object>} Created assignment
 */
export const assignUserToShift = async (assignmentData) => {
  const { shiftId, staffId, canteenId, date, assignedBy } = assignmentData;

  // Check if shift exists
  const shift = await Shift.findOne({ _id: shiftId, isDeleted: { $ne: true } });
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  // Check if user is already assigned to this shift on this date
  const existingAssignment = await StaffShift.findOne({
    shiftId,
    staffId,
    date: new Date(date),
    isDeleted: { $ne: true },
  });
  if (existingAssignment) {
    throw new AppError(
      "Staff is already assigned to this shift on this date",
      400,
    );
  }

  await validateAssignmentOverlap({
    staffId,
    canteenId,
    date,
    shift,
  });

  const assignment = await StaffShift.create({
    shiftId,
    staffId,
    canteenId,
    date: new Date(date),
    assignedBy,
  });

  return assignment;
};

/**
 * Get shift assignments
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Array of assignments
 */
export const getShiftAssignments = async (query = {}) => {
  const filter = { isDeleted: { $ne: true } };

  if (query.shiftId) {
    filter.shiftId = query.shiftId;
  }
  if (query.staffId) {
    filter.staffId = query.staffId;
  }
  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.date) {
    const date = new Date(query.date);
    filter.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999)),
    };
  }

  const assignments = await StaffShift.find(filter)
    .populate("shiftId", "name startTime endTime")
    .populate("staffId", "fullName email")
    .populate("canteenId", "name")
    .populate("assignedBy", "fullName")
    .sort({ date: -1 });

  return assignments;
};

/**
 * Get assignments by staff
 * @param {string} staffId - Staff ID
 * @param {Object} query - Additional query parameters
 * @returns {Promise<Array>} Array of assignments
 */
export const getAssignmentsByStaff = async (staffId, query = {}) => {
  const filter = { staffId, isDeleted: { $ne: true } };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate && query.endDate) {
    filter.date = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const assignments = await StaffShift.find(filter)
    .populate("shiftId", "name startTime endTime")
    .populate("canteenId", "name location")
    .sort({ date: -1 });

  return assignments;
};

/**
 * Check in to shift
 * @param {string} assignmentId - Assignment ID
 * @param {string} staffId - Staff ID
 * @returns {Promise<Object>} Updated assignment
 */
export const checkIn = async (assignmentId, staffId) => {
  const assignment = await StaffShift.findById(assignmentId);

  if (!assignment) {
    throw new AppError("Shift assignment not found", 404);
  }

  if (assignment.staffId.toString() !== staffId.toString()) {
    throw new AppError("You are not assigned to this shift", 403);
  }

  if (assignment.status !== "scheduled") {
    throw new AppError("Cannot check in with current status", 400);
  }

  assignment.status = "checked_in";
  assignment.checkInTime = new Date();
  await assignment.save();

  return assignment;
};

/**
 * Check out from shift
 * @param {string} assignmentId - Assignment ID
 * @param {string} staffId - Staff ID
 * @returns {Promise<Object>} Updated assignment
 */
export const checkOut = async (assignmentId, staffId) => {
  const assignment = await StaffShift.findById(assignmentId);

  if (!assignment) {
    throw new AppError("Shift assignment not found", 404);
  }

  if (assignment.staffId.toString() !== staffId.toString()) {
    throw new AppError("You are not assigned to this shift", 403);
  }

  if (assignment.status !== "checked_in") {
    throw new AppError("You must check in first", 400);
  }

  assignment.status = "checked_out";
  assignment.checkOutTime = new Date();

  // Calculate work hours inline (calculateWorkHours removed in v2.0)
  if (assignment.checkInTime && assignment.checkOutTime) {
    const totalMs = assignment.checkOutTime - assignment.checkInTime;
    assignment.actualWorkHours = totalMs / (1000 * 60 * 60);
    assignment.actualWorkMinutes = Math.round(totalMs / (1000 * 60));
  }

  await assignment.save();

  return assignment;
};

/**
 * Remove staff from shift
 * @param {string} assignmentId - Assignment ID
 */
export const removeStaffFromShift = async (assignmentId) => {
  const assignment = await StaffShift.findOneAndDelete({
    _id: assignmentId,
    isDeleted: { $ne: true },
  });
  if (!assignment) {
    throw new AppError("Shift assignment not found", 404);
  }
};

/**
 * Update assignment status (by admin)
 * @param {string} assignmentId - Assignment ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated assignment
 */
export const updateAssignment = async (assignmentId, updateData) => {
  const assignment = await StaffShift.findOneAndUpdate(
    {
      _id: assignmentId,
      isDeleted: { $ne: true },
    },
    updateData,
    { new: true, runValidators: true },
  );

  if (!assignment) {
    throw new AppError("Shift assignment not found", 404);
  }

  return assignment;
};

export const removeUserFromShift = async (assignmentId) => {
  return removeStaffFromShift(assignmentId);
};

export const bulkSaveAssignments = async (assignments = [], currentUser = null) => {
  const saved = [];
  let scopedCanteenId = currentUser?.canteenId ? String(currentUser.canteenId) : null;

  if ((currentUser?.role === "manager" || currentUser?.role === "staff") && !scopedCanteenId) {
    throw new AppError("Tài khoản chưa được gán canteen", 400);
  }

  for (const item of assignments) {
    if (!item?.shiftId || !item?.staffId || !item?.date) continue;

    const shift = await Shift.findOne({
      _id: item.shiftId,
      isDeleted: { $ne: true },
    });
    if (!shift) continue;

    const shiftCanteenId = String(shift.canteenId);

    if (scopedCanteenId && scopedCanteenId !== shiftCanteenId) {
      throw new AppError("Shift không thuộc canteen hiện tại", 400);
    }

    if (!scopedCanteenId) {
      scopedCanteenId = shiftCanteenId;
    }

    const dateOnly = normalizeDateOnly(item.date);
    const existingAssignment = await StaffShift.findOne({
      shiftId: item.shiftId,
      staffId: item.staffId,
      date: dateOnly,
      isDeleted: { $ne: true },
    }).select("_id");

    const payload = {
      shiftId: item.shiftId,
      staffId: item.staffId,
      canteenId: shift.canteenId,
      date: dateOnly,
      status: item?.status || "draft",
      assignedBy: currentUser?._id || null,
    };

    await validateAssignmentOverlap({
      staffId: item.staffId,
      canteenId: shift.canteenId,
      date: dateOnly,
      shift,
      excludeAssignmentId: existingAssignment?._id || null,
    });

    const assignment = await StaffShift.findOneAndUpdate(
      {
        shiftId: item.shiftId,
        staffId: item.staffId,
        date: dateOnly,
        isDeleted: { $ne: true },
      },
      payload,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    saved.push(assignment);
  }

  return saved;
};

export const publishAssignments = async (payload = {}, currentUser = null) => {
  const filter = { isDeleted: { $ne: true } };

  if ((currentUser?.role === "manager" || currentUser?.role === "staff") && !currentUser?.canteenId) {
    throw new AppError("Tài khoản chưa được gán canteen", 400);
  }

  if (currentUser?.canteenId) {
    filter.canteenId = currentUser.canteenId;
  }

  if (payload?.startDate || payload?.endDate) {
    filter.date = {};
    if (payload.startDate) filter.date.$gte = normalizeDateOnly(payload.startDate);
    if (payload.endDate) {
      const end = normalizeDateOnly(payload.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const draftFilter = {
    ...filter,
    status: "draft",
  };

  const result = await StaffShift.updateMany(draftFilter, {
    $set: {
      status: "scheduled",
      publishedAt: new Date(),
    },
  });

  const targetAssignments = await StaffShift.find(filter)
    .populate("shiftId", "name startTime endTime")
    .select("staffId shiftId date canteenId status");

  const notifiedStaffIds = new Set();

  for (const assignment of targetAssignments) {
    const staffId = String(assignment.staffId || "");
    if (!staffId || notifiedStaffIds.has(staffId)) continue;

    notifiedStaffIds.add(staffId);

    const notification = await createNotification({
      userId: assignment.staffId,
      canteenId: assignment.canteenId,
      type: "shift",
      title: "Lịch làm việc đã được cập nhật",
      content: "Quản lý vừa publish lịch làm việc mới. Vui lòng kiểm tra lịch của bạn.",
      metadata: {
        kind: "schedule_published",
        startDate: payload?.startDate || null,
        endDate: payload?.endDate || null,
      },
    });

    try {
      notifyUser(String(assignment.staffId), {
        notificationId: String(notification._id),
        title: notification.title,
        content: notification.content,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    } catch {
      // Ignore websocket failures
    }
  }

  return {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
    notifiedCount: notifiedStaffIds.size,
  };
};

export const createShiftChangeRequest = async (payload = {}, currentUser = null) => {
  if (currentUser?.role === "staff" && !isWeekend()) {
    throw new AppError(
      "Staff chỉ có thể gửi yêu cầu đổi ca vào Thứ 7 hoặc Chủ nhật",
      400,
    );
  }

  const assignment = await StaffShift.findOne({
    _id: payload.staffShiftId,
    isDeleted: { $ne: true },
  });

  if (!assignment) {
    throw new AppError("Shift assignment not found", 404);
  }

  if (
    currentUser?.role === "staff" &&
    String(assignment.staffId) !== String(currentUser._id)
  ) {
    throw new AppError("You can only request shift change for your own assignment", 403);
  }

  const existsPending = await ShiftChangeRequest.findOne({
    staffShiftId: assignment._id,
    status: "pending",
  });

  if (existsPending) {
    throw new AppError("A pending change request already exists for this assignment", 400);
  }

  const request = await ShiftChangeRequest.create({
    staffShiftId: assignment._id,
    staffId: assignment.staffId,
    requestedShiftId: payload.requestedShiftId || null,
    reason: payload.reason,
    status: "pending",
  });

  const staffUser = await User.findById(assignment.staffId).select("fullName canteenId");
  const managerFilter = {
    role: "manager",
    status: "active",
  };

  if (assignment?.canteenId) {
    managerFilter.canteenId = assignment.canteenId;
  }

  const managers = await User.find(managerFilter).select("_id");

  for (const manager of managers) {
    const notification = await createNotification({
      userId: manager._id,
      canteenId: assignment.canteenId || staffUser?.canteenId || null,
      type: "shift",
      title: "Có yêu cầu đổi ca mới",
      content: `${staffUser?.fullName || "Nhân viên"} vừa gửi yêu cầu đổi ca cần duyệt.`,
      metadata: {
        kind: "shift_change_request",
        requestId: request._id,
        staffShiftId: assignment._id,
      },
    });

    try {
      notifyUser(String(manager._id), {
        notificationId: String(notification._id),
        title: notification.title,
        content: notification.content,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    } catch {
      // Ignore websocket failures
    }
  }

  return request;
};

export const reviewShiftChangeRequest = async (
  requestId,
  status,
  currentUser = null,
) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new AppError("Invalid review status", 400);
  }

  const request = await ShiftChangeRequest.findById(requestId).populate("staffShiftId");

  if (!request) {
    throw new AppError("Shift change request not found", 404);
  }

  if (request.status !== "pending") {
    throw new AppError("Request has already been reviewed", 400);
  }

  if (
    currentUser?.canteenId &&
    String(request?.staffShiftId?.canteenId || "") !== String(currentUser.canteenId)
  ) {
    throw new AppError("You do not have permission to review this request", 403);
  }

  request.status = status;
  request.reviewedBy = currentUser?._id || null;
  request.reviewedAt = new Date();
  await request.save();

  if (status === "approved") {
    if (request.requestedShiftId) {
      await StaffShift.findOneAndUpdate(
        {
          _id: request.staffShiftId._id,
          isDeleted: { $ne: true },
        },
        {
          shiftId: request.requestedShiftId,
          status: "scheduled",
        },
      );
    } else {
      await StaffShift.findOneAndUpdate(
        {
          _id: request.staffShiftId._id,
          isDeleted: { $ne: true },
        },
        {
          status: "cancelled",
        },
      );
    }
  }

  const isApproved = status === "approved";
  const staffNotification = await createNotification({
    userId: request.staffId,
    canteenId: request?.staffShiftId?.canteenId || null,
    type: "shift",
    title: isApproved
      ? "Yêu cầu đổi ca đã được duyệt"
      : "Yêu cầu đổi ca bị từ chối",
    content: isApproved
      ? request.requestedShiftId
        ? "Quản lý đã duyệt yêu cầu đổi ca của bạn. Lịch làm việc đã được cập nhật."
        : "Quản lý đã duyệt yêu cầu đổi ca của bạn. Ca làm hiện tại đã được gỡ khỏi lịch."
      : "Quản lý đã từ chối yêu cầu đổi ca của bạn.",
    metadata: {
      kind: "shift_change_reviewed",
      requestId: request._id,
      staffShiftId: request.staffShiftId._id,
      reviewStatus: status,
    },
  });

  try {
    notifyUser(String(request.staffId), {
      notificationId: String(staffNotification._id),
      title: staffNotification.title,
      content: staffNotification.content,
      type: staffNotification.type,
      createdAt: staffNotification.createdAt,
    });
  } catch {
    // Ignore websocket failures
  }

  return request;
};

export const getAvailableShiftsForChangeRequest = async (currentUser = null) => {
  const filter = { status: "active", isDeleted: { $ne: true } };

  if (currentUser?.canteenId) {
    filter.canteenId = currentUser.canteenId;
  }

  return Shift.find(filter)
    .select("_id name startTime endTime canteenId")
    .sort({ startTime: 1, name: 1 });
};
