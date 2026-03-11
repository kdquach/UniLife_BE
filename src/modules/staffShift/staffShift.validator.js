import AppError from "../../utils/AppError.js";

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Ngày phân công không hợp lệ", 400);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const validateAssignmentPayload = (payload = {}) => {
  if (!payload?.scheduleId || !payload?.staffId || !payload?.shiftId || !payload?.date) {
    throw new AppError("Thiếu scheduleId/staffId/shiftId/date", 400);
  }
};

const ensureCanEditAssignment = (assignment, currentUser) => {
  if (!assignment) {
    throw new AppError("Không tìm thấy phân công", 404);
  }

  if (currentUser?.role !== "admin" && String(assignment.canteenId) !== String(currentUser?.canteenId || "")) {
    throw new AppError("Không có quyền thao tác phân công này", 403);
  }
};

export default {
  normalizeDateOnly,
  validateAssignmentPayload,
  ensureCanEditAssignment,
};
