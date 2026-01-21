import crypto from "crypto";
import { Token, OTP } from "./token.model.js";
import AppError from "../../utils/AppError.js";

// ============ Token Services ============

export const createToken = async (userId, type, expiresInHours = 24) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  // Remove existing tokens of same type for user
  await Token.deleteMany({ userId, type });

  const newToken = await Token.create({
    userId,
    token,
    type,
    expiresAt,
  });

  return newToken;
};

export const verifyToken = async (token, type) => {
  const tokenDoc = await Token.findOne({
    token,
    type,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) {
    throw new AppError("Invalid or expired token", 400);
  }

  return tokenDoc;
};

export const deleteToken = async (token) => {
  await Token.findOneAndDelete({ token });
};

export const deleteUserTokens = async (userId, type = null) => {
  const filter = { userId };
  if (type) filter.type = type;
  await Token.deleteMany(filter);
};

// ============ OTP Services ============

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOTP = async (email, type, expiresInMinutes = 10) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Remove existing OTPs of same type for email
  await OTP.deleteMany({ email, type });

  const newOTP = await OTP.create({
    email,
    otp,
    type,
    expiresAt,
  });

  return { otp, otpId: newOTP._id };
};

export const verifyOTP = async (email, otp, type) => {
  const otpDoc = await OTP.findOne({
    email,
    type,
    expiresAt: { $gt: new Date() },
    verified: false,
  });

  if (!otpDoc) {
    throw new AppError("OTP not found or expired", 400);
  }

  if (otpDoc.attempts >= 5) {
    throw new AppError(
      "Maximum attempts exceeded. Please request a new OTP",
      400,
    );
  }

  if (otpDoc.otp !== otp) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw new AppError("Invalid OTP", 400);
  }

  otpDoc.verified = true;
  await otpDoc.save();

  return otpDoc;
};

export const deleteOTP = async (email, type) => {
  await OTP.deleteMany({ email, type });
};
