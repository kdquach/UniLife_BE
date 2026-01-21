import express from "express";
import * as bannerController from "./banner.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/active", bannerController.getActiveBanners);

// Protected routes - Admin only
router.use(protect);
router.use(restrictTo("admin"));

router
  .route("/")
  .get(bannerController.getAllBanners)
  .post(bannerController.createBanner);

router.post("/reorder", bannerController.reorderBanners);

router
  .route("/:id")
  .get(bannerController.getBannerById)
  .patch(bannerController.updateBanner)
  .delete(bannerController.deleteBanner);

export default router;
