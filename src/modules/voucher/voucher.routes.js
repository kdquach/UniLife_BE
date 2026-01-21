import express from "express";
import * as voucherController from "./voucher.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/active", voucherController.getActiveVouchers);
router.get("/code/:code", voucherController.getVoucherByCode);

// Protected routes
router.use(protect);

router.post("/validate", voucherController.validateVoucher);
router.get("/my-usage", voucherController.getMyVoucherUsage);

// Admin routes
router.use(restrictTo("admin"));

router
  .route("/")
  .get(voucherController.getAllVouchers)
  .post(voucherController.createVoucher);

router
  .route("/:id")
  .get(voucherController.getVoucherById)
  .patch(voucherController.updateVoucher)
  .delete(voucherController.deleteVoucher);

router.get("/:id/stats", voucherController.getVoucherUsageStats);

export default router;
