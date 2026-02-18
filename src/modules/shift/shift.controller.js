import catchAsync from "../../utils/catchAsync.js";
import * as shiftService from "./shift.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Shift, StaffShift } from "./shift.model.js";
import User from "../user/user.model.js";
import { ShiftChangeRequest } from "./shiftChangeRequest.model.js";

// ============ Shift Controllers ============

/**
 * Create a new shift
 * @route POST /api/shifts
 * @access Private (Admin)
 */
export const createShift = catchAsync(async (req, res) => {
  const shift = await shiftService.createShift(req.body);

  res.status(201).json({
    status: "success",
    data: {
      shift,
    },
  });
});

/**
 * Get all shifts with pagination
 * @route GET /api/shifts?page=1&limit=10&canteenId=xxx&status=active
 * @access Private (Staff, Admin)
 */
export const getAllShifts = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Shift, req.query, {
    ...filterPresets.shift,
    populate: [{ path: "canteenId", select: "name location" }],
  });

  res
    .status(200)
    .json(
      formatPaginatedResponse(result, "Lấy danh sách ca làm việc thành công"),
    );
});

/**
 * Get shift by ID
 * @route GET /api/shifts/:id
 * @access Private (Staff, Admin)
 */
export const getShiftById = catchAsync(async (req, res) => {
  const shift = await shiftService.getShiftById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      shift,
    },
  });
});

/**
 * Update shift
 * @route PATCH /api/shifts/:id
 * @access Private (Admin)
 */
export const updateShift = catchAsync(async (req, res) => {
  const shift = await shiftService.updateShift(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      shift,
    },
  });
});

/**
 * Delete shift
 * @route DELETE /api/shifts/:id
 * @access Private (Admin)
 */
export const deleteShift = catchAsync(async (req, res) => {
  await shiftService.deleteShift(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ============ Shift Assignment Controllers ============

/**
 * Assign user to shift
 * @route POST /api/shifts/assignments
 * @access Private (Admin)
 */
export const assignUserToShift = catchAsync(async (req, res) => {
  const assignment = await shiftService.assignUserToShift(req.body);

  res.status(201).json({
    status: "success",
    data: {
      assignment,
    },
  });
});

/**
 * Get shift assignments with pagination
 * @route GET /api/shifts/assignments?page=1&limit=10&status=scheduled
 * @access Private (Staff, Admin)
 */
export const getShiftAssignments = catchAsync(async (req, res) => {
  const result = await paginatedQuery(StaffShift, req.query, {
    allowedFilters: ["shiftId", "staffId", "canteenId", "status", "date"],
    allowedSortFields: ["date", "createdAt"],
    defaultSort: "-date",
    populate: [
      { path: "shiftId", select: "name startTime endTime" },
      { path: "staffId", select: "fullName email" },
      { path: "canteenId", select: "name" },
      { path: "assignedBy", select: "fullName" },
    ],
  });

  res
    .status(200)
    .json(
      formatPaginatedResponse(
        result,
        "Lấy danh sách phân công ca làm việc thành công",
      ),
    );
});

/**
 * Get my shift assignments with pagination
 * @route GET /api/shifts/my-assignments?page=1&limit=10
 * @access Private (Staff)
 */
export const getMyAssignments = catchAsync(async (req, res) => {
  const result = await paginatedQuery(StaffShift, req.query, {
    baseFilter: { staffId: req.user._id },
    allowedFilters: ["status", "date"],
    allowedSortFields: ["date", "createdAt"],
    defaultSort: "-date",
    populate: [
      { path: "shiftId", select: "name startTime endTime" },
      { path: "canteenId", select: "name location" },
    ],
  });

  res
    .status(200)
    .json(
      formatPaginatedResponse(result, "Lấy ca làm việc của bạn thành công"),
    );
});

/**
 * Check in to shift
 * @route POST /api/shifts/assignments/:id/check-in
 * @access Private (Staff)
 */
export const checkIn = catchAsync(async (req, res) => {
  const assignment = await shiftService.checkIn(req.params.id, req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      assignment,
    },
  });
});

/**
 * Check out from shift
 * @route POST /api/shifts/assignments/:id/check-out
 * @access Private (Staff)
 */
export const checkOut = catchAsync(async (req, res) => {
  const assignment = await shiftService.checkOut(req.params.id, req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      assignment,
    },
  });
});

/**
 * Remove user from shift
 * @route DELETE /api/shifts/assignments/:id
 * @access Private (Admin)
 */
export const removeUserFromShift = catchAsync(async (req, res) => {
  await shiftService.removeUserFromShift(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Update assignment
 * @route PATCH /api/shifts/assignments/:id
 * @access Private (Admin)
 */
export const updateAssignment = catchAsync(async (req, res) => {
  const assignment = await shiftService.updateAssignment(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: {
      assignment,
    },
  });
});

export const bulkSaveAssignments = catchAsync(async (req, res) => {
  const assignments = Array.isArray(req.body?.assignments) ? req.body.assignments : [];
  const data = await shiftService.bulkSaveAssignments(assignments, req.user);

  res.status(200).json({
    success: true,
    message: "Lưu nháp phân ca thành công",
    data,
  });
});

export const publishAssignments = catchAsync(async (req, res) => {
  const data = await shiftService.publishAssignments(req.body || {}, req.user);

  res.status(200).json({
    success: true,
    message: "Phát hành lịch làm việc thành công",
    data,
  });
});

export const getShiftManagerStaffList = catchAsync(async (req, res) => {
  const filter = {
    role: "staff",
    status: "active",
  };

  if (req.user?.canteenId) {
    filter.canteenId = req.user.canteenId;
  }

  if (req.query?.search) {
    filter.$or = [
      { fullName: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("_id fullName email canteenId")
    .sort({ fullName: 1 })
    .limit(200);

  res.status(200).json({
    success: true,
    data: users,
  });
});

export const getMyShiftChangeRequests = catchAsync(async (req, res) => {
  const filter = { staffId: req.user._id };

  if (req.query?.status) {
    filter.status = req.query.status;
  }

  const requests = await ShiftChangeRequest.find(filter)
    .populate("staffId", "fullName email")
    .populate({
      path: "staffShiftId",
      populate: { path: "shiftId", select: "name startTime endTime" },
    })
    .populate("requestedShiftId", "name startTime endTime")
    .sort({ createdAt: -1 })
    .limit(200);

  res.status(200).json({
    success: true,
    data: requests,
  });
});

export const getShiftChangeRequests = catchAsync(async (req, res) => {
  const filter = {};

  if (req.query?.status) {
    filter.status = req.query.status;
  }

  const requests = await ShiftChangeRequest.find(filter)
    .populate("staffId", "fullName email")
    .populate({
      path: "staffShiftId",
      populate: { path: "shiftId", select: "name startTime endTime" },
    })
    .populate("requestedShiftId", "name startTime endTime")
    .sort({ createdAt: -1 })
    .limit(200);

  const scoped = req.user?.canteenId
    ? requests.filter(
        (item) =>
          String(item?.staffShiftId?.canteenId || "") ===
          String(req.user.canteenId),
      )
    : requests;

  res.status(200).json({
    success: true,
    data: scoped,
  });
});

export const createShiftChangeRequest = catchAsync(async (req, res) => {
  const payload = {
    staffShiftId: req.body?.staffShiftId,
    reason: req.body?.reason,
  };

  const request = await shiftService.createShiftChangeRequest(payload, req.user);

  res.status(201).json({
    success: true,
    message: "Tạo yêu cầu đổi ca thành công",
    data: { request },
  });
});

export const reviewShiftChangeRequest = catchAsync(async (req, res) => {
  const request = await shiftService.reviewShiftChangeRequest(
    req.params.id,
    req.body?.status,
    req.user,
  );

  res.status(200).json({
    success: true,
    message: "Cập nhật yêu cầu đổi ca thành công",
    data: { request },
  });
});

export const getAvailableShiftsForChangeRequest = catchAsync(async (req, res) => {
  const shifts = await shiftService.getAvailableShiftsForChangeRequest(req.user);

  res.status(200).json({
    success: true,
    data: shifts,
  });
});
