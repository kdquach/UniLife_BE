import { Shift, StaffShift } from "./shift.model.js";
import AppError from "../../utils/AppError.js";

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
  const filter = {};

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
  const shift = await Shift.findById(id).populate("canteenId", "name location");

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
  const shift = await Shift.findByIdAndUpdate(id, updateData, {
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
  const shift = await Shift.findByIdAndDelete(id);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  // Also delete all assignments for this shift
  await StaffShift.deleteMany({ shiftId: id });
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
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  // Check if user is already assigned to this shift on this date
  const existingAssignment = await StaffShift.findOne({
    shiftId,
    staffId,
    date: new Date(date),
  });
  if (existingAssignment) {
    throw new AppError(
      "Staff is already assigned to this shift on this date",
      400,
    );
  }

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
  const filter = {};

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
  const filter = { staffId };

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
  assignment.calculateWorkHours();
  await assignment.save();

  return assignment;
};

/**
 * Remove staff from shift
 * @param {string} assignmentId - Assignment ID
 */
export const removeStaffFromShift = async (assignmentId) => {
  const assignment = await StaffShift.findByIdAndDelete(assignmentId);
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
  const assignment = await StaffShift.findByIdAndUpdate(
    assignmentId,
    updateData,
    { new: true, runValidators: true },
  );

  if (!assignment) {
    throw new AppError("Shift assignment not found", 404);
  }

  return assignment;
};
