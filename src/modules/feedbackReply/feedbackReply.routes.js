import express from 'express';
import * as feedbackReplyController from './feedbackReply.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get(
  '/:feedbackId/replies',
  feedbackReplyController.getRepliesByFeedback
);

// Protected routes
router.use(protect);

router.post('/:feedbackId/replies', feedbackReplyController.createReply);
router.patch('/:id', feedbackReplyController.updateReply);
router.delete('/:id', feedbackReplyController.deleteReply);

export default router;
