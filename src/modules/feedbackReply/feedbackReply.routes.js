import express from 'express';
import * as feedbackReplyController from './feedbackReply.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { auditLogger } from '../auditLog/auditLog.middleware.js';

const router = express.Router();

// Public routes
router.get(
  '/:feedbackId/replies',
  feedbackReplyController.getRepliesByFeedback
);

// Protected routes
router.use(protect);

router.post(
  '/:feedbackId/replies',
  auditLogger('CREATE', 'FeedbackReply', 'FeedbackReply'),
  feedbackReplyController.createReply
);
router.patch(
  '/:id',
  auditLogger('UPDATE', 'FeedbackReply', 'FeedbackReply'),
  feedbackReplyController.updateReply
);
router.delete(
  '/:id',
  auditLogger('DELETE', 'FeedbackReply', 'FeedbackReply'),
  feedbackReplyController.deleteReply
);

export default router;
