import mongoose from "mongoose";

// Token Schema - For refresh tokens, password reset tokens, etc.
const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    token: {
      type: String,
      required: [true, "Token is required"],
      unique: true,
    },
    type: {
      type: String,
      enum: ["refresh", "reset_password", "verify_email"],
      required: [true, "Token type is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
  },
  {
    timestamps: true,
  },
);

tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// OTP Schema - For phone/email verification, 2FA
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
    },
    type: {
      type: String,
      enum: ["register", "reset_password", "login", "verify"],
      required: [true, "OTP type is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Maximum attempts exceeded"],
    },
  },
  {
    timestamps: true,
  },
);

otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Token = mongoose.model("Token", tokenSchema);
export const OTP = mongoose.model("OTP", otpSchema);
