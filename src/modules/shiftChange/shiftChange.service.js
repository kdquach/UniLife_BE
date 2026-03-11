import AppError from "../../utils/AppError.js";
import { StaffShift } from "../staffShift/staffShift.model.js";
import { ShiftChangeRequest } from "./shiftChange.model.js";

const VALID_TYPES = ["drop", "swap", "replace"];
const VALID_REVIEW_STATUSES = ["approved", "rejected"];

const validateCreatePayload = (payload = {}) => {
  if (!payload?.staffShiftId) {
    throw new AppError("Thiếu staffShiftId", 400);
  }

  if (!VALID_TYPES.includes(payload?.type)) {
    throw new AppError("Loại yêu cầu không hợp lệ", 400);
  }

  if (!payload?.reason) {
    throw new AppError("Thiếu lý do đổi ca", 400);
  }

  if (["swap", "replace"].includes(payload.type) && !payload?.targetStaffId) {
    throw new AppError("Thiếu targetStaffId cho yêu cầu swap/replace", 400);
  }
};

const validateReviewStatus = (status) => {
  if (!VALID_REVIEW_STATUSES.includes(status)) {
    throw new AppError("Trạng thái xử lý không hợp lệ", 400);
  }
};

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const buildShiftStartDateTime = (assignmentDate, shiftStartTime) => {
  const [hours, minutes] = String(shiftStartTime || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const date = new Date(assignmentDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const getDayRange = (value) => {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);

  const end = new Date(value);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const ensureTargetStaffNoConflict = async ({
  assignment,
  targetStaffId,
}) => {
  await assignment.populate({
    path: "shiftId",
    select: "startTime endTime",
  });

  const currentShiftStart = timeToMinutes(assignment?.shiftId?.startTime);
  const currentShiftEnd = timeToMinutes(assignment?.shiftId?.endTime);

  if (currentShiftStart === null || currentShiftEnd === null || currentShiftStart >= currentShiftEnd) {
    throw new AppError("Khung giờ ca hiện tại không hợp lệ", 400);
  }

  const { start, end } = getDayRange(assignment.date);
  const existingAssignments = await StaffShift.find({
    _id: { $ne: assignment._id },
    staffId: targetStaffId,
    date: {
      $gte: start,
      $lte: end,
    },
    isDeleted: { $ne: true },
    status: { $nin: ["cancelled"] },
  }).populate({
    path: "shiftId",
    select: "startTime endTime",
  });

  const hasConflict = existingAssignments.some((item) => {
    const startMinutes = timeToMinutes(item?.shiftId?.startTime);
    const endMinutes = timeToMinutes(item?.shiftId?.endTime);
    if (startMinutes === null || endMinutes === null) {
      return false;
    }
    return rangesOverlap(currentShiftStart, currentShiftEnd, startMinutes, endMinutes);
  });

  if (hasConflict) {
    throw new AppError("Nhân viên mục tiêu đã có ca trùng giờ", 400);
  }
};

export const expirePendingShiftChangeRequests = async () => {
  const now = new Date();

  const pending = await ShiftChangeRequest.find({ status: "pending" })
    .populate({
      path: "staffShiftId",
      populate: {
        path: "shiftId",
        select: "startTime",
      },
      select: "date shiftId",
    })
    .select("_id staffShiftId")
    .lean();

  const toExpire = [];

  pending.forEach((item) => {
    const assignmentDate = item?.staffShiftId?.date;
    const startTime = item?.staffShiftId?.shiftId?.startTime;

    if (!assignmentDate || !startTime) return;

    const [hours, minutes] = String(startTime).split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;

    const startAt = new Date(assignmentDate);
    startAt.setHours(hours, minutes, 0, 0);

    if (startAt <= now) {
      toExpire.push(item._id);
    }
  });

  if (!toExpire.length) {
    return 0;
  }

  const result = await ShiftChangeRequest.updateMany(
    {
      _id: { $in: toExpire },
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        reviewedBy: null,
        reviewedAt: now,
      },
    },
  );

  return result.modifiedCount || 0;
};

const createRequest = async (payload = {}, currentUser = null) => {
  const requestPayload = {
    ...payload,
    type: payload?.type || "drop",
  };

  validateCreatePayload(requestPayload);

  const assignment = await StaffShift.findById(requestPayload.staffShiftId).populate({
    path: "shiftId",
    select: "startTime",
  });
  if (!assignment) {
    throw new AppError("Không tìm thấy phân công", 404);
  }

  if (String(assignment.staffId) !== String(currentUser?._id || "")) {
    throw new AppError("Chỉ được tạo yêu cầu cho ca của chính bạn", 403);
  }

  // Chặn gửi yêu cầu cho ca đã bắt đầu hoặc quá khứ.
  const startAt = buildShiftStartDateTime(assignment.date, assignment?.shiftId?.startTime);
  if (!startAt || startAt <= new Date()) {
    throw new AppError("Không thể tạo yêu cầu cho ca đã bắt đầu hoặc đã qua", 400);
  }

  const pending = await ShiftChangeRequest.findOne({
    staffShiftId: assignment._id,
    status: "pending",
  });

  if (pending) {
    throw new AppError("Đã tồn tại yêu cầu pending cho ca này", 400);
  }

  return ShiftChangeRequest.create({
    staffShiftId: assignment._id,
    staffId: currentUser._id,
    type: requestPayload.type,
    targetStaffId: requestPayload.targetStaffId || null,
    reason: requestPayload.reason,
    status: "pending",
  });
};

const listRequests = async (query = {}, currentUser = null) => {
  const baseQuery = {
    ...(query?.status ? { status: query.status } : {}),
  };

  if (currentUser?.role !== "admin" && !currentUser?.canteenId) {
    return [];
  }

  const scopedStaffShiftIds = currentUser?.role === "admin"
    ? null
    : await StaffShift.find({
      canteenId: currentUser.canteenId,
      isDeleted: { $ne: true },
    }).distinct("_id");

  if (currentUser?.role !== "admin" && !scopedStaffShiftIds.length) {
    return [];
  }

  const requests = await ShiftChangeRequest.find({
    ...baseQuery,
    ...(currentUser?.role === "admin"
      ? {}
      : {
        staffShiftId: { $in: scopedStaffShiftIds },
      }),
  })
    .populate("staffId", "fullName email")
    .populate("targetStaffId", "fullName email")
    .populate({
      path: "staffShiftId",
      select: "date shiftId staffId canteenId",
      populate: [
        { path: "shiftId", select: "name startTime endTime" },
        { path: "staffId", select: "fullName email" },
        { path: "canteenId", select: "name location" },
      ],
    })
    .sort({ createdAt: -1 });

  return requests;
};

const listMyRequests = async (query = {}, currentUser = null) => {
  if (!currentUser?._id) {
    throw new AppError("Không tìm thấy người dùng hiện tại", 401);
  }

  return ShiftChangeRequest.find({
    staffId: currentUser._id,
    ...(query?.status ? { status: query.status } : {}),
  })
    .populate({
      path: "staffShiftId",
      select: "date shiftId staffId canteenId",
      populate: [
        { path: "shiftId", select: "name startTime endTime" },
        { path: "canteenId", select: "name location" },
      ],
    })
    .sort({ createdAt: -1 });
};

const approveRequest = async (requestId, currentUser = null) => {
  const request = await ShiftChangeRequest.findById(requestId);
  if (!request) {
    throw new AppError("Không tìm thấy yêu cầu đổi ca", 404);
  }

  if (request.status !== "pending") {
    throw new AppError("Yêu cầu đã được xử lý", 400);
  }

  const assignment = await StaffShift.findById(request.staffShiftId?._id || request.staffShiftId).populate({
    path: "shiftId",
    select: "startTime endTime",
  });
  if (!assignment) {
    throw new AppError("Không tìm thấy phân công của yêu cầu", 404);
  }

  const shiftStartAt = buildShiftStartDateTime(assignment.date, assignment?.shiftId?.startTime);
  if (!shiftStartAt || shiftStartAt <= new Date()) {
    throw new AppError("Không thể xử lý yêu cầu cho ca đã bắt đầu", 400);
  }

  if (request.type === "drop") {
    await StaffShift.findByIdAndDelete(assignment._id);
  } else if (["swap", "replace"].includes(request.type)) {
    if (!request.targetStaffId) {
      throw new AppError("Thiếu targetStaffId cho yêu cầu swap/replace", 400);
    }

    // Đảm bảo nhân viên đích không bị trùng ca trước khi cập nhật.
    await ensureTargetStaffNoConflict({
      assignment,
      targetStaffId: request.targetStaffId,
    });

    await StaffShift.findByIdAndUpdate(assignment._id, {
      staffId: request.targetStaffId,
      assignedBy: currentUser?._id,
      updatedAt: new Date(),
    });
  }

  request.status = "approved";
  request.reviewedBy = currentUser?._id || null;
  request.reviewedAt = new Date();

  await request.save();

  return request;
};

const rejectRequest = async (requestId, currentUser = null) => {
  const request = await ShiftChangeRequest.findById(requestId);
  if (!request) {
    throw new AppError("Không tìm thấy yêu cầu đổi ca", 404);
  }

  if (request.status !== "pending") {
    throw new AppError("Yêu cầu đã được xử lý", 400);
  }

  request.status = "rejected";
  request.reviewedBy = currentUser?._id || null;
  request.reviewedAt = new Date();

  await request.save();

  return request;
};

const reviewRequest = async (requestId, status, currentUser = null) => {
  validateReviewStatus(status);

  if (status === "approved") {
    return approveRequest(requestId, currentUser);
  }

  return rejectRequest(requestId, currentUser);
};

export default {
  listRequests,
  listMyRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  reviewRequest,
  expirePendingShiftChangeRequests,
};
