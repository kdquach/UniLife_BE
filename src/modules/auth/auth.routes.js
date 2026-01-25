import express from "express";
import * as authController from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Registration with OTP
router.post("/register/send-otp", authController.sendRegisterOTP);
router.post("/register/verify-otp", authController.verifyRegisterOTP);

// Legacy register (without OTP - can be removed later)
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);

// Forgot Password
router.post("/forgot-password", authController.forgotPassword);
router.post(
  "/forgot-password/verify-otp",
  authController.verifyForgotPasswordOTP,
);
router.post("/reset-password", authController.resetPassword);

// Logout
router.post("/logout", protect, authController.logout);

// Change Password
router.post("/change-password", protect, authController.changePassword);

export default router;
