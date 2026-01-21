import { Feedback, FeedbackReply } from "./feedback.model.js";
import AppError from "../../utils/AppError.js";

// ============ Feedback Services ============

export const createFeedback = async (userId, feedbackData) => {
  const feedback = await Feedback.create({ userId, ...feedbackData });
  return feedback;
};

export const getAllFeedbacks = async (query = {}) => {
  const filter = {};
  if (query.productId) filter.productId = query.productId;
  if (query.orderId) filter.orderId = query.orderId;
  if (query.userId) filter.userId = query.userId;
  if (query.rating) filter.rating = query.rating;

  const feedbacks = await Feedback.find(filter)
    .populate("userId", "fullName avatar")
    .populate("productId", "name image")
    .sort({ createdAt: -1 });
  return feedbacks;
};

export const getFeedbackById = async (id) => {
  const feedback = await Feedback.findById(id)
    .populate("userId", "fullName avatar")
    .populate("productId", "name image")
    .populate("orderId");
  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }
  return feedback;
};

export const getFeedbacksByProduct = async (productId) => {
  const feedbacks = await Feedback.find({ productId })
    .populate("userId", "fullName avatar")
    .sort({ createdAt: -1 });
  return feedbacks;
};

export const getProductRatingStats = async (productId) => {
  const stats = await Feedback.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratings: {
          $push: "$rating",
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return { avgRating: 0, totalReviews: 0, distribution: {} };
  }

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats[0].ratings.forEach((r) => distribution[r]++);

  return {
    avgRating: Math.round(stats[0].avgRating * 10) / 10,
    totalReviews: stats[0].totalReviews,
    distribution,
  };
};

export const updateFeedback = async (id, userId, updateData) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }
  if (feedback.userId.toString() !== userId.toString()) {
    throw new AppError("You can only update your own feedback", 403);
  }

  Object.assign(feedback, updateData);
  await feedback.save();
  return feedback;
};

export const deleteFeedback = async (id, userId, isAdmin = false) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }
  if (!isAdmin && feedback.userId.toString() !== userId.toString()) {
    throw new AppError("You can only delete your own feedback", 403);
  }

  await Feedback.findByIdAndDelete(id);
  await FeedbackReply.deleteMany({ feedbackId: id });
};

// ============ Feedback Reply Services ============

export const createReply = async (feedbackId, userId, reply) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  const feedbackReply = await FeedbackReply.create({
    feedbackId,
    userId,
    reply,
  });
  return feedbackReply;
};

export const getRepliesByFeedback = async (feedbackId) => {
  const replies = await FeedbackReply.find({ feedbackId })
    .populate("userId", "fullName avatar role")
    .sort({ createdAt: 1 });
  return replies;
};

export const updateReply = async (id, userId, reply) => {
  const feedbackReply = await FeedbackReply.findById(id);
  if (!feedbackReply) {
    throw new AppError("Reply not found", 404);
  }
  if (feedbackReply.userId.toString() !== userId.toString()) {
    throw new AppError("You can only update your own reply", 403);
  }

  feedbackReply.reply = reply;
  await feedbackReply.save();
  return feedbackReply;
};

export const deleteReply = async (id, userId, isAdmin = false) => {
  const feedbackReply = await FeedbackReply.findById(id);
  if (!feedbackReply) {
    throw new AppError("Reply not found", 404);
  }
  if (!isAdmin && feedbackReply.userId.toString() !== userId.toString()) {
    throw new AppError("You can only delete your own reply", 403);
  }

  await FeedbackReply.findByIdAndDelete(id);
};

import mongoose from "mongoose";
