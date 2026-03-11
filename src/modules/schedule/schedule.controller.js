import catchAsync from "../../utils/catchAsync.js";
import scheduleService from "./schedule.service.js";

export const createSchedule = catchAsync(async (req, res) => {
  const result = await scheduleService.createScheduleDraft(req.body, req.user);

  res.status(201).json({
    status: "success",
    message: "Tạo lịch draft thành công",
    data: {
      schedule: result.schedule,
      savedAssignments: result.savedAssignments,
      ignoredAssignments: result.ignoredAssignments,
    },
  });
});

export const publishSchedule = catchAsync(async (req, res) => {
  const schedule = await scheduleService.publishSchedule(req.params.id, req.user);

  res.status(200).json({
    status: "success",
    message: "Publish lịch thành công",
    data: {
      schedule,
    },
  });
});

export const getPublishedSchedule = catchAsync(async (req, res) => {
  const result = await scheduleService.getPublishedSchedule(req.query, req.user);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDraftSchedule = catchAsync(async (req, res) => {
  const result = await scheduleService.getDraftSchedule(req.query, req.user);

  res.status(200).json({
    status: "success",
    data: result,
  });
});
