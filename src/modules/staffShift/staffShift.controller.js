import catchAsync from "../../utils/catchAsync.js";
import staffShiftService from "./staffShift.service.js";

export const getMySchedule = catchAsync(async (req, res) => {
  const assignments = await staffShiftService.getStaffSchedule(req.user, req.query);

  res.status(200).json({
    status: "success",
    results: assignments.length,
    data: assignments,
  });
});
