import catchAsync from "../../utils/catchAsync.js";
import * as feedbackService from "./feedback.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Feedback, FeedbackReply } from "./feedback.model.js";

// ============ Feedback Controllers ============

export const createFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.user._id, req.body);
  res.status(201).json({ status: "success", data: { feedback } });
});

export const getAllFeedbacks = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Feedback, req.query, {
    ...filterPresets.feedback,
    populate: [
      { path: "userId", select: "fullName email" },
      { path: "productId", select: "name image" },
      { path: "orderId", select: "orderNumber" },
    ],
  });
  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy danh sách feedback thành công"));
});

export const getFeedbackById = catchAsync(async (req, res) => {
  const feedback = await feedbackService.getFeedbackById(req.params.id);
  res.status(200).json({ status: "success", data: { feedback } });
});

export const getFeedbacksByProduct = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Feedback, req.query, {
    ...filterPresets.feedback,
    baseFilter: { productId: req.params.productId },
    populate: [{ path: "userId", select: "fullName" }],
  });
  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy feedback sản phẩm thành công"));
});

export const getProductRatingStats = catchAsync(async (req, res) => {
  const stats = await feedbackService.getProductRatingStats(
    req.params.productId,
  );
  res.status(200).json({ status: "success", data: { stats } });
});

export const updateFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.updateFeedback(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { feedback } });
});

export const deleteFeedback = catchAsync(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  await feedbackService.deleteFeedback(req.params.id, req.user._id, isAdmin);
  res.status(204).json({ status: "success", data: null });
});

// ============ Reply Controllers ============

export const createReply = catchAsync(async (req, res) => {
  const reply = await feedbackService.createReply(
    req.params.feedbackId,
    req.user._id,
    req.body.reply,
  );
  res.status(201).json({ status: "success", data: { reply } });
});

export const getRepliesByFeedback = catchAsync(async (req, res) => {
  const result = await paginatedQuery(FeedbackReply, req.query, {
    baseFilter: { feedbackId: req.params.feedbackId },
    populate: [{ path: "userId", select: "fullName role" }],
    allowedSortFields: ["createdAt"],
    defaultSort: "createdAt",
  });
  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy danh sách phản hồi thành công"));
});

export const updateReply = catchAsync(async (req, res) => {
  const reply = await feedbackService.updateReply(
    req.params.id,
    req.user._id,
    req.body.reply,
  );
  res.status(200).json({ status: "success", data: { reply } });
});

export const deleteReply = catchAsync(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  await feedbackService.deleteReply(req.params.id, req.user._id, isAdmin);
  res.status(204).json({ status: "success", data: null });
});
