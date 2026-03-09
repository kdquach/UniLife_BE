import AppError from "../../utils/AppError.js";

export const normalizeDateOnly = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getWeekRange = (weekStart) => {
  const start = startOfDay(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const ensureRoleHasCanteen = (currentUser = null) => {
  if (
    (currentUser?.role === "manager" || currentUser?.role === "staff")
    && !currentUser?.canteenId
  ) {
    throw new AppError("Tài khoản chưa được gán canteen", 400);
  }
};

export const validateNotPastDate = (dateValue) => {
  const target = startOfDay(dateValue);
  const today = startOfDay(new Date());
  if (target < today) {
    throw new AppError("Không thể chỉnh sửa ca trong quá khứ", 400);
  }
};

export const validateNotExecutedStatus = (status) => {
  if (["checked_in", "checked_out", "absent"].includes(status)) {
    throw new AppError("Không thể chỉnh sửa ca đã thực thi", 400);
  }
};

export const validatePublishRange = (weekStart) => {
  const target = startOfDay(weekStart);
  const today = startOfDay(new Date());
  if (target < today) {
    throw new AppError("Chỉ được phát hành lịch từ hiện tại trở đi", 400);
  }
};

const timeToMinutes = (value) => {
  if (!value || typeof value !== "string") return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

export const validateShiftOverlap = (assignments = []) => {
  const grouped = new Map();

  for (const item of assignments) {
    const staffId = String(item.staffId || "");
    const date = normalizeDateOnly(item.date).toISOString();
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);

    if (!staffId || start === null || end === null) {
      throw new AppError("Dữ liệu ca làm không hợp lệ", 400);
    }

    const key = `${staffId}:${date}`;
    const bucket = grouped.get(key) || [];

    for (const existing of bucket) {
      if (rangesOverlap(start, end, existing.start, existing.end)) {
        throw new AppError("Nhân viên bị trùng ca trong cùng ngày", 400);
      }
    }

    bucket.push({ start, end });
    grouped.set(key, bucket);
  }
};
