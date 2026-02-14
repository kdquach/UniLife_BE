import { Feedback } from './feedback.model.js';
import AppError from '../../utils/AppError.js';
import { paginatedQuery, filterPresets } from '../../utils/queryHelper.js';
import mongoose from 'mongoose';

import Order from '../order/order.model.js';

export const createFeedback = async (userId, feedbackData) => {
  const { orderId, productId } = feedbackData;

  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }

  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new AppError('Order không hợp lệ', 403);
  }

  if (order.status !== 'completed') {
    throw new AppError('Chỉ có thể đánh giá sau khi nhận hàng', 400);
  }

  const hasProduct = order.items.some(
    (item) => item.productId.toString() === productId.toString()
  );

  if (!hasProduct) {
    throw new AppError('Sản phẩm không thuộc đơn hàng này', 400);
  }

  try {
    const feedback = await Feedback.create({ userId, ...feedbackData });
    // Populate userId to get avatar and role for UI
    return await feedback.populate('userId', 'fullName avatar role _id');
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi',
        400
      );
    }
    throw err;
  }
};

export const getAllFeedbacks = async (query) => {
  return await paginatedQuery(Feedback, query, {
    ...filterPresets.feedback,
    populate: [
      { path: 'userId', select: 'fullName email' },
      { path: 'productId', select: 'name image' },
      { path: 'orderId', select: 'orderNumber' },
    ],
  });
};

export const getFeedbackById = async (id) => {
  const feedback = await Feedback.findById(id)
    .populate('userId', 'fullName avatar')
    .populate('productId', 'name image')
    .populate('orderId', 'orderNumber createdAt');
  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }
  return feedback;
};

export const getFeedbacksByProduct = async (productId, query) => {
  return await paginatedQuery(Feedback, query, {
    ...filterPresets.feedback,
    baseFilter: { productId },
    populate: [{ path: 'userId', select: 'fullName avatar role _id' }],
    sort: '-createdAt',
  });
};

export const getProductRatingStats = async (productId) => {
  // Validate productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid productId', 400);
  }

  // Aggregate: gom theo rating và đếm số lượng
  const stats = await Feedback.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);

  // Xử lý kết quả
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let totalScore = 0;

  stats.forEach(({ _id, count }) => {
    distribution[_id] = count;
    totalReviews += count;
    totalScore += _id * count;
  });

  // Trả kết quả chuẩn
  return {
    avgRating: totalReviews
      ? Math.round((totalScore / totalReviews) * 10) / 10
      : 0,
    totalReviews,
    distribution,
  };
};

export const updateFeedback = async (id, userId, updateData) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }
  if (feedback.userId.toString() !== userId.toString()) {
    throw new AppError('You can only update your own feedback', 403);
  }
  const diffDays = (Date.now() - feedback.createdAt) / (1000 * 60 * 60 * 24);

  if (diffDays > 7) {
    throw new AppError('Không thể sửa feedback sau 7 ngày', 400);
  }

  const allowedFields = ['comment', 'rating'];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      feedback[field] = updateData[field];
    }
  });

  await feedback.save();

  // Populate userId to get avatar and role for UI
  return await feedback.populate('userId', 'fullName avatar role _id');
};

export const deleteFeedback = async (id, userId, isAdmin = false) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }
  if (!isAdmin && feedback.userId.toString() !== userId.toString()) {
    throw new AppError('You can only delete your own feedback', 403);
  }

  await feedback.deleteOne();

  const { FeedbackReply } =
    await import('../feedbackReply/feedbackReply.model.js');
  await FeedbackReply.deleteMany({ feedbackId: id });
};
