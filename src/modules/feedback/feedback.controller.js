import catchAsync from "../../utils/catchAsync.js";
import * as feedbackService from "./feedback.service.js";

// ============ Feedback Controllers ============

export const createFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.user._id, req.body);
  res.status(201).json({ status: "success", data: { feedback } });
});

export const getAllFeedbacks = catchAsync(async (req, res) => {
  const feedbacks = await feedbackService.getAllFeedbacks(req.query);
  res
    .status(200)
    .json({
      status: "success",
      results: feedbacks.length,
      data: { feedbacks },
    });
});

export const getFeedbackById = catchAsync(async (req, res) => {
  const feedback = await feedbackService.getFeedbackById(req.params.id);
  res.status(200).json({ status: "success", data: { feedback } });
});

export const getFeedbacksByProduct = catchAsync(async (req, res) => {
  const feedbacks = await feedbackService.getFeedbacksByProduct(
    req.params.productId,
  );
  res
    .status(200)
    .json({
      status: "success",
      results: feedbacks.length,
      data: { feedbacks },
    });
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
  const replies = await feedbackService.getRepliesByFeedback(
    req.params.feedbackId,
  );
  res
    .status(200)
    .json({ status: "success", results: replies.length, data: { replies } });
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
