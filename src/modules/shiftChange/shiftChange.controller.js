import catchAsync from "../../utils/catchAsync.js";
import shiftChangeService from "./shiftChange.service.js";

export const getShiftChangeRequests = catchAsync(async (req, res) => {
  const requests = await shiftChangeService.listRequests(req.query, req.user);

  res.status(200).json({
    status: "success",
    results: requests.length,
    data: requests,
  });
});

export const getMyShiftChangeRequests = catchAsync(async (req, res) => {
  const requests = await shiftChangeService.listMyRequests(req.query, req.user);

  res.status(200).json({
    status: "success",
    results: requests.length,
    data: requests,
  });
});

export const createShiftChangeRequest = catchAsync(async (req, res) => {
  const request = await shiftChangeService.createRequest(req.body, req.user);

  res.status(201).json({
    status: "success",
    message: "Tạo yêu cầu đổi ca thành công",
    data: {
      request,
    },
  });
});

export const reviewShiftChangeRequest = catchAsync(async (req, res) => {
  const request = await shiftChangeService.reviewRequest(req.params.id, req.body?.status, req.user);

  res.status(200).json({
    status: "success",
    message: "Xử lý yêu cầu đổi ca thành công",
    data: {
      request,
    },
  });
});
