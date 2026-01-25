import express from "express";
import {
  viewProfile,
  updateProfile,
  uploadAvatar,
} from "./profile.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  uploadAvatar as uploadAvatarMiddleware,
  handleUploadError,
} from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", viewProfile);
router.patch("/", updateProfile);

// upload avatar
router.post(
  "/avatar",
  uploadAvatarMiddleware,
  handleUploadError,
  uploadAvatar
);

export default router;
