import catchAsync from "../../utils/catchAsync.js";
import * as attendanceService from "./attendance.service.js";

/**
 * Get today's assigned shifts with attendance status
 * @route GET /api/attendance/my-shifts?date=2024-02-14
 * @access Private (Staff, Admin)
 */
export const getMyShifts = catchAsync(async (req, res) => {
  const { date } = req.query;
  const result = await attendanceService.getMyShifts(req.user._id, date);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Check-in to a specific shift
 * @route POST /api/attendance/checkin
 * @body { shift_id: string, date?: string }
 * @access Private (Staff, Admin)
 */
export const checkIn = catchAsync(async (req, res) => {
  const { shift_id } = req.body;

  if (!shift_id) {
    return res.status(400).json({
      success: false,
      error: "MISSING_SHIFT_ID",
      message: "shift_id is required",
    });
  }

  const result = await attendanceService.checkIn(req.user._id, shift_id, req);

  res.status(200).json({
    success: true,
    message: result.message,
    warning: result.warning || undefined,
    data: result,
  });
});

/**
 * Check-out from a specific shift
 * @route POST /api/attendance/checkout
 * @body { shift_id: string, early_leave_reason?: string }
 * @access Private (Staff, Admin)
 */
export const checkOut = catchAsync(async (req, res) => {
  const { shift_id, early_leave_reason } = req.body;

  if (!shift_id) {
    return res.status(400).json({
      success: false,
      error: "MISSING_SHIFT_ID",
      message: "shift_id is required",
    });
  }

  const result = await attendanceService.checkOut(
    req.user._id,
    shift_id,
    early_leave_reason,
    req,
  );

  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * Get attendance history with filters
 * @route GET /api/attendance/history?month=2024-02&shift_id=1&status=late
 * @access Private (Staff, Admin)
 */
export const getHistory = catchAsync(async (req, res) => {
  const result = await attendanceService.getHistory(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get attendance detail
 * @route GET /api/attendance/:id
 * @access Private (Staff, Admin)
 */
export const getDetail = catchAsync(async (req, res) => {
  const result = await attendanceService.getDetail(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});
