import express from "express";
import * as feedbackController from "./feedback.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", feedbackController.getAllFeedbacks);
router.get("/product/:productId", feedbackController.getFeedbacksByProduct);
router.get(
  "/product/:productId/stats",
  feedbackController.getProductRatingStats,
);
router.get("/:id", feedbackController.getFeedbackById);
router.get("/:feedbackId/replies", feedbackController.getRepliesByFeedback);

// Protected routes
router.use(protect);

router.post("/", feedbackController.createFeedback);
router.patch("/:id", feedbackController.updateFeedback);
router.delete("/:id", feedbackController.deleteFeedback);

// Reply routes
router.post("/:feedbackId/replies", feedbackController.createReply);
router.patch("/replies/:id", feedbackController.updateReply);
router.delete("/replies/:id", feedbackController.deleteReply);

export default router;
