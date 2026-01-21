import mongoose from "mongoose";

// Feedback Schema
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ productId: 1 });
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ rating: 1 });

// Feedback Reply Schema
const feedbackReplySchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
      required: [true, "Feedback ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    reply: {
      type: String,
      required: [true, "Reply content is required"],
      trim: true,
      maxlength: [1000, "Reply cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

feedbackReplySchema.index({ feedbackId: 1 });

export const Feedback = mongoose.model("Feedback", feedbackSchema);
export const FeedbackReply = mongoose.model(
  "FeedbackReply",
  feedbackReplySchema,
);
