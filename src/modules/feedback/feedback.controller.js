import catchAsync from '../../utils/catchAsync.js';
import * as feedbackService from './feedback.service.js';
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from '../../utils/queryHelper.js';

export const createFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.user._id, req.body);
  res.status(201).json({ status: 'success', data: { feedback } });
});

export const getAllFeedbacks = catchAsync(async (req, res) => {
  // Nếu request có gửi kèm canteenId (ví dụ từ Dashboard qua header x-canteen-id),
  // thì chỉ lấy feedback của canteen đó
  const canteenIdFromHeader =
    req?.user?.canteenId;

  const query = { ...req.query };
  query.canteenId = canteenIdFromHeader || "__NO_MATCH__";


  // Map fromDate -> createdAt[gte] cho queryHelper (lọc theo ngày tạo)
  if (query.fromDate) {
    query["createdAt[gte]"] = query.fromDate;
    delete query.fromDate;
  }

  const result = await feedbackService.getAllFeedbacks(query);
  res
    .status(200)
    .json(formatPaginatedResponse(result, 'Lấy danh sách feedback thành công'));
})

// Lấy feedbacks của user hiện tại (authenticated)
export const getMyFeedbacks = catchAsync(async (req, res) => {
  // Thêm userId vào query để filter
  const query = { ...req.query, userId: req.user._id };
  const result = await feedbackService.getAllFeedbacks(query);
  res
    .status(200)
    .json(formatPaginatedResponse(result, 'Lấy feedback của bạn thành công'));
});

export const getFeedbackById = catchAsync(async (req, res) => {
  const feedback = await feedbackService.getFeedbackById(req.params.id);
  res.status(200).json({ status: 'success', data: { feedback } });
});

export const getFeedbacksByProduct = catchAsync(async (req, res) => {
  const result = await feedbackService.getFeedbacksByProduct(
    req.params.productId,
    req.query
  );

  res
    .status(200)
    .json(formatPaginatedResponse(result, 'Lấy feedback sản phẩm thành công'));
});

export const getProductRatingStats = catchAsync(async (req, res) => {
  const stats = await feedbackService.getProductRatingStats(
    req.params.productId
  );
  res.status(200).json({ status: 'success', data: { stats } });
});

export const updateFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.updateFeedback(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({ status: 'success', data: { feedback } });
});

export const deleteFeedback = catchAsync(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  await feedbackService.deleteFeedback(req.params.id, req.user._id, isAdmin);
  res.status(204).json({ status: 'success', data: null });
});
