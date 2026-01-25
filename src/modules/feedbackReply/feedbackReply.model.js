import mongoose from 'mongoose';

// Feedback Reply Schema
const feedbackReplySchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: [true, 'Feedback ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    reply: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

feedbackReplySchema.index({ feedbackId: 1 });

export const FeedbackReply = mongoose.model(
  'FeedbackReply',
  feedbackReplySchema
);
