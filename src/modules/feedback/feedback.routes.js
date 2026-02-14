import express from 'express';
import * as feedbackController from './feedback.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', feedbackController.getAllFeedbacks);
router.get('/product/:productId', feedbackController.getFeedbacksByProduct);
router.get(
  '/product/:productId/stats',
  feedbackController.getProductRatingStats
);

// Protected routes
router.use(protect);

// Lấy feedbacks của user hiện tại (phải đặt trước /:id)
router.get('/my-feedbacks', feedbackController.getMyFeedbacks);

router.post('/', feedbackController.createFeedback);
router.get('/:id', feedbackController.getFeedbackById);
router.patch('/:id', feedbackController.updateFeedback);
router.delete('/:id', feedbackController.deleteFeedback);

export default router;
