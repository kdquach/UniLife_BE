import catchAsync from "../../utils/catchAsync.js";
import * as shiftService from "./shift.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Shift, StaffShift } from "./shift.model.js";

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
