import mongoose from 'mongoose';

// Feedback Schema
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ productId: 1 });
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ rating: 1 });
// Một user chỉ có thể feedback 1 lần cho mỗi cặp (order, product)
feedbackSchema.index({ userId: 1, orderId: 1, productId: 1 }, { unique: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
