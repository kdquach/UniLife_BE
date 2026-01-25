import { FeedbackReply } from './feedbackReply.model.js';
import { Feedback } from '../feedback/feedback.model.js';
import AppError from '../../utils/AppError.js';

// ============ Feedback Reply Services ============

export const createReply = async (feedbackId, userId, reply) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new AppError('Feedback not found', 404);
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
    .populate('userId', 'fullName avatar role')
    .sort({ createdAt: 1 });
  return replies;
};

export const updateReply = async (id, userId, reply) => {
  const feedbackReply = await FeedbackReply.findById(id);
  if (!feedbackReply) {
    throw new AppError('Reply not found', 404);
  }
  if (feedbackReply.userId.toString() !== userId.toString()) {
    throw new AppError('You can only update your own reply', 403);
  }

  feedbackReply.reply = reply;
  await feedbackReply.save();
  return feedbackReply;
};

export const deleteReply = async (id, userId, isAdmin = false) => {
  const feedbackReply = await FeedbackReply.findById(id);
  if (!feedbackReply) {
    throw new AppError('Reply not found', 404);
  }
  if (!isAdmin && feedbackReply.userId.toString() !== userId.toString()) {
    throw new AppError('You can only delete your own reply', 403);
  }

  await FeedbackReply.findByIdAndDelete(id);
};
