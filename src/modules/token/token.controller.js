import catchAsync from "../../utils/catchAsync.js";
import * as tokenService from "./token.service.js";

export const createOTP = catchAsync(async (req, res) => {
  const { email, type } = req.body;
  const { otp } = await tokenService.createOTP(email, type);

  // In production, send OTP via email/SMS instead of returning it
  res.status(200).json({
    status: "success",
    message: "OTP sent successfully",
    // Remove this in production
    data: process.env.NODE_ENV === "development" ? { otp } : undefined,
  });
});

export const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp, type } = req.body;
  await tokenService.verifyOTP(email, otp, type);

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
  });
});

export const resendOTP = catchAsync(async (req, res) => {
  const { email, type } = req.body;
  await tokenService.deleteOTP(email, type);
  const { otp } = await tokenService.createOTP(email, type);

  res.status(200).json({
    status: "success",
    message: "OTP resent successfully",
    data: process.env.NODE_ENV === "development" ? { otp } : undefined,
  });
});
