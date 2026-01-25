import catchAsync from '../../utils/catchAsync.js';
import * as feedbackReplyService from './feedbackReply.service.js';
import {
  paginatedQuery,
  formatPaginatedResponse,
} from '../../utils/queryHelper.js';
import { FeedbackReply } from './feedbackReply.model.js';

// ============ Reply Controllers ============

export const createReply = catchAsync(async (req, res) => {
  const reply = await feedbackReplyService.createReply(
    req.params.feedbackId,
    req.user._id,
    req.body.reply
  );
  res.status(201).json({ status: 'success', data: { reply } });
});

export const getRepliesByFeedback = catchAsync(async (req, res) => {
  const result = await paginatedQuery(FeedbackReply, req.query, {
    baseFilter: { feedbackId: req.params.feedbackId },
    populate: [{ path: 'userId', select: 'fullName role' }],
    allowedSortFields: ['createdAt'],
    defaultSort: 'createdAt',
  });
  res
    .status(200)
    .json(formatPaginatedResponse(result, 'Lấy danh sách phản hồi thành công'));
});

export const updateReply = catchAsync(async (req, res) => {
  const reply = await feedbackReplyService.updateReply(
    req.params.id,
    req.user._id,
    req.body.reply
  );
  res.status(200).json({ status: 'success', data: { reply } });
});

export const deleteReply = catchAsync(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  await feedbackReplyService.deleteReply(req.params.id, req.user._id, isAdmin);
  res.status(204).json({ status: 'success', data: null });
});
