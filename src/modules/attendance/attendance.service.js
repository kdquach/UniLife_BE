import { StaffShift } from "../staffShift/staffShift.model.js";
import { Shift } from "../shift/shift.model.js";
import AppError from "../../utils/AppError.js";
import mongoose from "mongoose";

// ============ Helper Functions ============

/**
 * Validate that a string is a valid MongoDB ObjectId
 * Prevents CastError crashes that bypass error handler
 * @param {string} id
 * @param {string} fieldName
 */
const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }
};

/**
 * Get date range for a specific date (start of day -> end of day)
 * @param {Date|string} [dateInput] - Date to get range for, defaults to today
 * @returns {{ startOfDay: Date, endOfDay: Date }}
 */
const getDateRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  // Validate date is not Invalid Date
  if (isNaN(date.getTime())) {
    throw new AppError("Định dạng ngày không hợp lệ (YYYY-MM-DD)", 400);
  }
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

/**
 * Parse shift time string "HH:mm" to a Date object based on a reference date
 * @param {string} timeStr - Time string in "HH:mm" format
 * @param {Date} refDate - Reference date
 * @returns {Date}
 */
const parseShiftTime = (timeStr, refDate) => {
  if (!timeStr || typeof timeStr !== "string") {
    throw new AppError("Thời gian ca không hợp lệ", 500);
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new AppError("Thời gian ca không hợp lệ", 500);
  }
  const date = new Date(refDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Get client IP from request (safe access)
 * @param {Object} req - Express request
 * @returns {string}
 */
const getClientIp = (req) => {
  if (!req) return "unknown";
  try {
    return (
      req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
};

/**
 * Get client device info from request (safe access, truncated)
 * @param {Object} req - Express request
 * @returns {string}
 */
const getClientDevice = (req) => {
  if (!req) return "unknown";
  try {
    const ua = req.headers?.["user-agent"] || "unknown";
    // Truncate to prevent oversized strings being stored
    return ua.substring(0, 500);
  } catch {
    return "unknown";
  }
};

/**
 * Format minutes to "Xh Ym" string
 * @param {number} minutes
 * @returns {string}
 */
const formatMinutes = (minutes) => {
  if (!minutes || minutes < 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

// ============ GET MY SHIFTS (Today) ============

/**
 * Get all assigned shifts for a specific date with attendance status
 * GET /attendance/my-shifts
 *
 * @param {string} staffId - Staff user ID
 * @param {string} [date] - Date string (YYYY-MM-DD), defaults to today
 * @returns {Promise<Object>} Date + shifts array with can_checkin/can_checkout flags
 */
export const getMyShifts = async (staffId, date) => {
  validateObjectId(staffId, "Staff ID");
  const { startOfDay, endOfDay } = getDateRange(date);
  const now = new Date();

  // Find all assignments for this staff on this date (lean for read-only perf)
  const assignments = await StaffShift.find({
    staffId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ["absent"] },
  })
    .populate("shiftId")
    .populate("canteenId", "name")
    .populate("assignedBy", "fullName")
    .lean();

  // Sort by shift start time manually (populate doesn't support nested sort)
  assignments.sort((a, b) => {
    const aTime = a.shiftId?.startTime || "00:00";
    const bTime = b.shiftId?.startTime || "00:00";
    return aTime.localeCompare(bTime);
  });

  const shifts = assignments.map((assignment) => {
    const shift = assignment.shiftId;
    if (!shift) return null;

    const shiftStart = parseShiftTime(shift.startTime, assignment.date);
    const graceBefore = shift.gracePeriodBefore || 15;

    // Determine can_checkin and can_checkout based on current state
    const isAssigned = ["assigned", "scheduled"].includes(assignment.status);
    const isCheckedIn = assignment.status === "checked_in";
    const isCheckedOut = assignment.status === "checked_out";

    // can_checkin: assigned + within time window (shift_start - grace_before)
    const earliestCheckin = new Date(
      shiftStart.getTime() - graceBefore * 60 * 1000,
    );
    const canCheckin = isAssigned && now >= earliestCheckin;

    // can_checkout: checked_in and not yet checked_out
    const canCheckout = isCheckedIn;

    // Calculate current working minutes if checked in
    let currentWorkingMinutes = 0;
    let formattedWorkingTime = null;
    if (isCheckedIn && assignment.checkInTime) {
      const checkInDate = new Date(assignment.checkInTime);
      const actualStart = new Date(
        Math.max(checkInDate.getTime(), shiftStart.getTime()),
      );
      currentWorkingMinutes = Math.round((now - actualStart) / (1000 * 60));
      currentWorkingMinutes = Math.max(0, currentWorkingMinutes);
      formattedWorkingTime = formatMinutes(currentWorkingMinutes);
    }

    return {
      shift_id: shift._id,
      shift_name: shift.name,
      start_time: shift.startTime,
      end_time: shift.endTime,
      duration_minutes: shift.durationMinutes || null,
      canteen: assignment.canteenId
        ? { id: assignment.canteenId._id, name: assignment.canteenId.name }
        : null,
      assigned_by: assignment.assignedBy
        ? {
            id: assignment.assignedBy._id,
            fullName: assignment.assignedBy.fullName,
          }
        : null,
      can_checkin: canCheckin,
      can_checkout: canCheckout,
      attendance:
        isCheckedIn || isCheckedOut
          ? {
              id: assignment._id,
              check_in_time: assignment.checkInTime,
              check_out_time: assignment.checkOutTime || null,
              status: assignment.attendanceStatus,
              late_minutes: assignment.lateMinutes || 0,
              actual_work_minutes: isCheckedOut
                ? assignment.actualWorkMinutes
                : currentWorkingMinutes,
              formatted_working_time: isCheckedOut
                ? formatMinutes(assignment.actualWorkMinutes || 0)
                : formattedWorkingTime,
              overtime_minutes: assignment.overtimeMinutes || 0,
              needs_review: assignment.needsReview || false,
            }
          : null,
    };
  });

  const yyyy = startOfDay.getFullYear();
  const mm = String(startOfDay.getMonth() + 1).padStart(2, "0");
  const dd = String(startOfDay.getDate()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    shifts: shifts.filter(Boolean),
  };
};

// ============ CHECK-IN ============

/**
 * Staff check-in for a specific shift
 * POST /attendance/checkin
 *
 * @param {string} staffId - Staff user ID
 * @param {string} shiftId - Shift ID
 * @param {Object} req - Express request (for IP/device)
 * @returns {Promise<Object>} Check-in result
 */
export const checkIn = async (staffId, shiftId, req) => {
  validateObjectId(staffId, "Staff ID");
  validateObjectId(shiftId, "Shift ID");

  const { startOfDay, endOfDay } = getDateRange();
  const now = new Date();

  // 1. Find today's assignment for this shift
  const assignment = await StaffShift.findOne({
    staffId,
    shiftId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ["absent"] },
  }).populate("shiftId");

  if (!assignment) {
    throw new AppError("Bạn không có ca làm việc này hôm nay", 400);
  }

  const shift = assignment.shiftId;
  if (!shift) {
    throw new AppError("Không tìm thấy thông tin ca làm việc", 404);
  }

  // 2. Check duplicate check-in
  if (
    assignment.status === "checked_in" ||
    assignment.status === "checked_out"
  ) {
    const checkedInTime = assignment.checkInTime
      ? assignment.checkInTime.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    throw new AppError(`Bạn đã check-in ca này lúc ${checkedInTime} rồi`, 400);
  }

  // 3. Only allow check-in for "assigned" or "scheduled" status
  if (!["assigned", "scheduled"].includes(assignment.status)) {
    throw new AppError("Không thể check-in với trạng thái hiện tại", 400);
  }

  // 4. Time window validation
  const shiftStartTime = parseShiftTime(shift.startTime, assignment.date);
  const graceBefore = shift.gracePeriodBefore || 15;

  const earliestCheckin = new Date(
    shiftStartTime.getTime() - graceBefore * 60 * 1000,
  );

  if (now < earliestCheckin) {
    const availableTime = earliestCheckin.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    throw new AppError(
      `Quá sớm để check-in. Có thể check-in từ ${availableTime}`,
      400,
    );
  }

  // 5. Check for missing checkout on previous shifts today (limit query)
  let warning = null;
  const previousMissing = await StaffShift.find({
    staffId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: "checked_in",
    _id: { $ne: assignment._id },
  })
    .populate("shiftId", "name")
    .limit(10); // Safety limit

  if (previousMissing.length > 0) {
    // Batch update using updateMany instead of individual saves
    const missingIds = previousMissing.map((p) => p._id);
    await StaffShift.updateMany(
      { _id: { $in: missingIds } },
      { $set: { needsReview: true, attendanceStatus: "missing_checkout" } },
    );

    const missingShiftNames = previousMissing
      .map((p) => p.shiftId?.name || "Unknown")
      .join(", ");
    warning = `Bạn quên check-out ca: ${missingShiftNames}. Vui lòng liên hệ quản lý.`;
  }

  // 6. Calculate attendance status
  const diffMinutes = (now - shiftStartTime) / (1000 * 60);
  let attendanceStatus;
  let lateMinutes = 0;

  if (diffMinutes <= 0) {
    attendanceStatus = "on_time";
  } else if (diffMinutes <= 15) {
    // 1-15 min late: still counts as on_time (within grace period)
    attendanceStatus = "on_time";
    lateMinutes = Math.round(diffMinutes);
  } else if (diffMinutes <= 60) {
    attendanceStatus = "late";
    lateMinutes = Math.round(diffMinutes);
  } else {
    attendanceStatus = "critical_late";
    lateMinutes = Math.round(diffMinutes);
  }

  // 7. ATOMIC update: findOneAndUpdate with status $in ["assigned", "scheduled"] as filter
  //    This prevents race conditions — only 1 concurrent request can win
  const updated = await StaffShift.findOneAndUpdate(
    {
      _id: assignment._id,
      status: { $in: ["assigned", "scheduled"] }, // KEY: atomic guard — only matches if still valid for checkin
    },
    {
      $set: {
        status: "checked_in",
        checkInTime: now,
        attendanceStatus,
        lateMinutes,
        checkInIp: getClientIp(req),
        checkInDevice: getClientDevice(req),
      },
    },
    { new: true },
  );

  // If null, another concurrent request already checked in
  if (!updated) {
    throw new AppError(
      "Check-in thất bại — ca này đã được xử lý bởi request khác",
      409,
    );
  }

  // Build response message
  let message;
  if (attendanceStatus === "on_time") {
    message =
      lateMinutes > 0
        ? `Check-in thành công. Đúng giờ (${lateMinutes} phút trong grace period).`
        : "Check-in thành công. Đúng giờ!";
  } else if (attendanceStatus === "late") {
    message = `Check-in thành công. Bạn trễ ${lateMinutes} phút.`;
  } else {
    message = `Check-in thành công. Bạn trễ ${lateMinutes} phút. Cần xem xét!`;
  }

  return {
    id: assignment._id,
    shift_id: shift._id,
    shift_name: shift.name,
    check_in_time: assignment.checkInTime,
    status: attendanceStatus,
    late_minutes: lateMinutes,
    message,
    warning,
  };
};

// ============ CHECK-OUT ============

/**
 * Staff check-out from a specific shift
 * POST /attendance/checkout
 *
 * @param {string} staffId - Staff user ID
 * @param {string} shiftId - Shift ID
 * @param {string} [earlyLeaveReason] - Reason for early leave
 * @param {Object} req - Express request (for IP/device)
 * @returns {Promise<Object>} Check-out result
 */
export const checkOut = async (staffId, shiftId, earlyLeaveReason, req) => {
  validateObjectId(staffId, "Staff ID");
  validateObjectId(shiftId, "Shift ID");

  const { startOfDay, endOfDay } = getDateRange();
  const now = new Date();

  // 1. Read the assignment to get shift info for validation
  const existing = await StaffShift.findOne({
    staffId,
    shiftId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).populate("shiftId");

  if (!existing) {
    throw new AppError("Không tìm thấy ca làm việc hôm nay", 400);
  }

  const shift = existing.shiftId;
  if (!shift) {
    throw new AppError("Không tìm thấy thông tin ca làm việc", 404);
  }

  // 2. Must have checked in first
  if (existing.status === "assigned") {
    throw new AppError("Bạn phải check-in trước khi check-out", 400);
  }

  // 3. Check duplicate check-out (fast fail)
  if (existing.status === "checked_out") {
    const checkedOutTime = existing.checkOutTime
      ? existing.checkOutTime.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    throw new AppError(`Bạn đã check-out lúc ${checkedOutTime} rồi`, 400);
  }

  if (existing.status !== "checked_in") {
    throw new AppError("Không thể check-out với trạng thái hiện tại", 400);
  }

  // 4. Calculate work time
  const shiftStartTime = parseShiftTime(shift.startTime, existing.date);
  const shiftEndTime = parseShiftTime(shift.endTime, existing.date);
  const checkOutGrace = 5; // minutes

  // actual_start = MAX(check_in_time, shift_start_time)
  const actualStart = new Date(
    Math.max(existing.checkInTime.getTime(), shiftStartTime.getTime()),
  );
  let actualWorkMinutes = Math.round((now - actualStart) / (1000 * 60));
  actualWorkMinutes = Math.max(0, actualWorkMinutes);

  // 5. Overtime calculation
  let overtimeMinutes = 0;
  const shiftEndPlusGrace = new Date(
    shiftEndTime.getTime() + checkOutGrace * 60 * 1000,
  );
  if (now > shiftEndPlusGrace) {
    overtimeMinutes = Math.round((now - shiftEndTime) / (1000 * 60));
  }

  // 6. Determine checkout status
  let checkoutStatus = existing.attendanceStatus;
  const shiftEndMinusGrace = new Date(
    shiftEndTime.getTime() - checkOutGrace * 60 * 1000,
  );

  if (now < shiftEndMinusGrace) {
    checkoutStatus = "early_leave";
  } else if (overtimeMinutes > 0) {
    checkoutStatus = "overtime";
  }

  // 7. ATOMIC update: findOneAndUpdate with status:"checked_in" as filter
  //    This prevents race conditions — only 1 concurrent request can win
  const updateFields = {
    status: "checked_out",
    checkOutTime: now,
    attendanceStatus: checkoutStatus,
    actualWorkMinutes,
    actualWorkHours: actualWorkMinutes / 60,
    overtimeMinutes,
    overtimeApproved: false,
    checkOutIp: getClientIp(req),
    checkOutDevice: getClientDevice(req),
  };

  // Sanitize earlyLeaveReason
  if (checkoutStatus === "early_leave" && earlyLeaveReason) {
    updateFields.earlyLeaveReason = String(earlyLeaveReason).substring(0, 500);
  }

  const assignment = await StaffShift.findOneAndUpdate(
    {
      _id: existing._id,
      status: "checked_in", // KEY: atomic guard — only matches if still "checked_in"
    },
    { $set: updateFields },
    { new: true },
  );

  // If null, another concurrent request already checked out
  if (!assignment) {
    throw new AppError(
      "Check-out thất bại — ca này đã được xử lý bởi request khác",
      409,
    );
  }

  // 8. Build response
  let message = `Check-out thành công. Tổng: ${formatMinutes(actualWorkMinutes)}`;
  if (overtimeMinutes > 0) {
    message += `. Overtime: ${formatMinutes(overtimeMinutes)} (Chờ duyệt)`;
  }
  if (checkoutStatus === "early_leave") {
    message += ". Bạn ra sớm.";
  }

  return {
    id: assignment._id,
    shift_id: shift._id,
    shift_name: shift.name,
    check_in_time: assignment.checkInTime,
    check_out_time: assignment.checkOutTime,
    status: checkoutStatus,
    actual_work_minutes: actualWorkMinutes,
    overtime_minutes: overtimeMinutes,
    overtime_approved: false,
    early_leave_reason: assignment.earlyLeaveReason || null,
    message,
  };
};

// ============ ATTENDANCE HISTORY ============

/**
 * Get attendance history with filters and pagination
 * GET /attendance/history
 *
 * Uses MongoDB aggregation for summary to avoid loading all documents into memory.
 *
 * @param {string} staffId - Staff user ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} { summary, records, pagination }
 */
export const getHistory = async (staffId, filters = {}) => {
  validateObjectId(staffId, "Staff ID");

  const query = { staffId: new mongoose.Types.ObjectId(staffId) };

  // ---- Date filters (with validation) ----
  if (filters.date) {
    const { startOfDay, endOfDay } = getDateRange(filters.date);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  } else if (filters.start_date && filters.end_date) {
    const start = new Date(filters.start_date);
    const end = new Date(filters.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("Định dạng ngày không hợp lệ (YYYY-MM-DD)", 400);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  } else if (filters.month) {
    const parts = filters.month.split("-");
    if (parts.length !== 2) {
      throw new AppError("Định dạng tháng không hợp lệ (YYYY-MM)", 400);
    }
    const [year, mon] = parts.map(Number);
    if (isNaN(year) || isNaN(mon) || mon < 1 || mon > 12) {
      throw new AppError("Định dạng tháng không hợp lệ (YYYY-MM)", 400);
    }
    query.date = {
      $gte: new Date(year, mon - 1, 1),
      $lte: new Date(year, mon, 0, 23, 59, 59, 999),
    };
  } else if (filters.year) {
    const year = parseInt(filters.year);
    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new AppError("Năm không hợp lệ", 400);
    }
    query.date = {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  } else {
    // Default: current month
    const now = new Date();
    query.date = {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1),
      $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  // ---- Shift filter ----
  if (filters.shift_id) {
    validateObjectId(filters.shift_id, "Shift ID");
    query.shiftId = new mongoose.Types.ObjectId(filters.shift_id);
  }

  // ---- Status filter ----
  const validStatuses = [
    "on_time",
    "late",
    "critical_late",
    "early_leave",
    "missing_checkout",
    "overtime",
  ];
  if (filters.status) {
    if (!validStatuses.includes(filters.status)) {
      throw new AppError(
        `Status không hợp lệ. Cho phép: ${validStatuses.join(", ")}`,
        400,
      );
    }
    query.attendanceStatus = filters.status;
  }

  // Only include records that have been checked in
  query.status = { $in: ["checked_in", "checked_out"] };

  // ---- Pagination ----
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 30));
  const skip = (page - 1) * limit;

  // ---- Execute queries in parallel ----
  // Use aggregation for summary to avoid loading all docs into memory
  const [records, totalRecords, summaryResult] = await Promise.all([
    StaffShift.find(query)
      .populate("shiftId", "name startTime endTime durationMinutes")
      .populate("canteenId", "name")
      .sort({ date: -1, checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StaffShift.countDocuments(query),
    StaffShift.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_shifts: { $sum: 1 },
          on_time: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "on_time"] }, 1, 0],
            },
          },
          late: {
            $sum: {
              $cond: [
                {
                  $in: ["$attendanceStatus", ["late", "critical_late"]],
                },
                1,
                0,
              ],
            },
          },
          early_leave: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "early_leave"] }, 1, 0],
            },
          },
          missing_checkout: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "missing_checkout"] }, 1, 0],
            },
          },
          total_work_minutes: {
            $sum: { $ifNull: ["$actualWorkMinutes", 0] },
          },
          total_overtime_minutes: {
            $sum: { $ifNull: ["$overtimeMinutes", 0] },
          },
          total_late_minutes: {
            $sum: { $ifNull: ["$lateMinutes", 0] },
          },
        },
      },
    ]),
  ]);

  // Extract summary (aggregation returns array)
  const rawSummary = summaryResult[0] || {};
  const summary = {
    total_shifts: rawSummary.total_shifts || 0,
    on_time: rawSummary.on_time || 0,
    late: rawSummary.late || 0,
    early_leave: rawSummary.early_leave || 0,
    missing_checkout: rawSummary.missing_checkout || 0,
    total_work_minutes: rawSummary.total_work_minutes || 0,
    total_hours: Math.round((rawSummary.total_work_minutes || 0) / 60),
    overtime_hours: Math.round((rawSummary.total_overtime_minutes || 0) / 60),
    total_late_minutes: rawSummary.total_late_minutes || 0,
  };

  // ---- Format records ----
  const formattedRecords = records.map((r) => ({
    id: r._id,
    date: r.date,
    shift: r.shiftId
      ? {
          id: r.shiftId._id,
          name: r.shiftId.name,
          start_time: r.shiftId.startTime,
          end_time: r.shiftId.endTime,
        }
      : null,
    canteen: r.canteenId
      ? { id: r.canteenId._id, name: r.canteenId.name }
      : null,
    check_in_time: r.checkInTime,
    check_out_time: r.checkOutTime || null,
    status: r.attendanceStatus,
    late_minutes: r.lateMinutes || 0,
    actual_work_minutes: r.actualWorkMinutes || 0,
    formatted_work_time: formatMinutes(r.actualWorkMinutes || 0),
    overtime_minutes: r.overtimeMinutes || 0,
    needs_review: r.needsReview || false,
  }));

  return {
    summary,
    records: formattedRecords,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(totalRecords / limit),
      total_records: totalRecords,
      limit,
    },
  };
};

// ============ ATTENDANCE DETAIL ============

/**
 * Get detailed attendance record
 * GET /attendance/:id
 *
 * @param {string} staffId - Staff user ID
 * @param {string} id - Attendance record ID (StaffShift _id)
 * @returns {Promise<Object>} Detailed attendance record
 */
export const getDetail = async (staffId, id) => {
  validateObjectId(staffId, "Staff ID");
  validateObjectId(id, "Attendance ID");

  const record = await StaffShift.findOne({ _id: id, staffId })
    .populate("shiftId")
    .populate("canteenId", "name")
    .populate("assignedBy", "fullName") // Scheduler
    .populate("reviewedBy", "fullName email")
    .lean();

  if (!record) {
    throw new AppError("Không tìm thấy bản ghi chấm công", 404);
  }

  const shift = record.shiftId;

  return {
    id: record._id,
    date: record.date,
    shift: shift
      ? {
          id: shift._id,
          name: shift.name,
          start_time: shift.startTime,
          end_time: shift.endTime,
          duration_minutes: shift.durationMinutes || null,
        }
      : null,
    canteen: record.canteenId
      ? { id: record.canteenId._id, name: record.canteenId.name }
      : null,
    assigned_by: record.assignedBy
      ? { id: record.assignedBy._id, fullName: record.assignedBy.fullName }
      : null,
    check_in_time: record.checkInTime || null,
    check_in_ip: record.checkInIp || null,
    check_in_device: record.checkInDevice || null,
    check_out_time: record.checkOutTime || null,
    check_out_ip: record.checkOutIp || null,
    check_out_device: record.checkOutDevice || null,
    status: record.attendanceStatus,
    late_minutes: record.lateMinutes || 0,
    actual_work_minutes: record.actualWorkMinutes || 0,
    formatted_work_time: formatMinutes(record.actualWorkMinutes || 0),
    overtime_minutes: record.overtimeMinutes || 0,
    overtime_approved: record.overtimeApproved || false,
    early_leave_reason: record.earlyLeaveReason || null,
    needs_review: record.needsReview || false,
    reviewed_by: record.reviewedBy
      ? {
          id: record.reviewedBy._id,
          fullName: record.reviewedBy.fullName,
        }
      : null,
    reviewed_at: record.reviewedAt || null,
    manager_note: record.managerNote || null,
    notes: record.notes || null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
};

// ============ MISSING CHECKOUT DETECTION ============

/**
 * Detect and flag missing checkouts
 * Run as cronjob every 2 hours
 *
 * Uses batched processing with a limit to prevent memory issues.
 *
 * @returns {Promise<number>} Number of flagged records
 */
export const detectMissingCheckouts = async () => {
  const now = new Date();
  const BATCH_SIZE = 100;
  let totalFlagged = 0;
  let hasMore = true;

  while (hasMore) {
    // Process in batches to prevent memory issues
    const checkedInRecords = await StaffShift.find({
      status: "checked_in",
      attendanceStatus: { $ne: "missing_checkout" },
    })
      .populate("shiftId", "endTime")
      .limit(BATCH_SIZE)
      .lean();

    if (checkedInRecords.length === 0) {
      hasMore = false;
      break;
    }

    const idsToFlag = [];

    for (const record of checkedInRecords) {
      if (!record.shiftId?.endTime) continue;

      try {
        const shiftEnd = parseShiftTime(record.shiftId.endTime, record.date);
        const threshold = new Date(shiftEnd.getTime() + 2 * 60 * 60 * 1000);

        if (now >= threshold) {
          idsToFlag.push(record._id);
        }
      } catch {
        // Skip records with invalid shift time
        continue;
      }
    }

    if (idsToFlag.length > 0) {
      // Batch update instead of individual saves
      await StaffShift.updateMany(
        { _id: { $in: idsToFlag } },
        {
          $set: {
            attendanceStatus: "missing_checkout",
            needsReview: true,
          },
        },
      );
      totalFlagged += idsToFlag.length;
    }

    // If we got fewer than BATCH_SIZE, we're done
    if (checkedInRecords.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return totalFlagged;
};
