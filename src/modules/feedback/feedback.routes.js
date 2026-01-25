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
router.get('/:id', feedbackController.getFeedbackById);

// Protected routes
router.use(protect);

router.post('/', feedbackController.createFeedback);
router.patch('/:id', feedbackController.updateFeedback);
router.delete('/:id', feedbackController.deleteFeedback);

export default router;
