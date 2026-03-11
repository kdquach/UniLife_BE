import AppError from "../../utils/AppError.js";
import { StaffShift } from "./staffShift.model.js";
import { Schedule } from "../schedule/schedule.model.js";

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Ngày không hợp lệ", 400);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getStaffSchedule = async (currentUser = null, query = {}) => {
  if (!currentUser?._id) {
    throw new AppError("Không tìm thấy staffId", 401);
  }

  const filter = {
    staffId: currentUser._id,
    status: { $in: ["scheduled", "checked_in", "checked_out"] },
    isDeleted: { $ne: true },
  };

  if (currentUser?.canteenId) {
    filter.canteenId = currentUser.canteenId;
  }

  if (query?.weekStart) {
    filter.date = { $gte: normalizeDateOnly(query.weekStart) };
  }

  const publishedScheduleIds = await Schedule.find({
    status: "published",
    ...(currentUser?.canteenId ? { canteenId: currentUser.canteenId } : {}),
  }).distinct("_id");

  if (!publishedScheduleIds.length) {
    return [];
  }

  return StaffShift.find({
    ...filter,
    scheduleId: { $in: publishedScheduleIds },
  })
    .populate("shiftId", "name startTime endTime")
    .populate("canteenId", "name location")
    .sort({ date: -1 });
};

export default {
  getStaffSchedule,
};
