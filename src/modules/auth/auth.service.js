import User from "../user/user.model.js";
import { generateToken } from "../../utils/jwt.js";
import AppError from "../../utils/AppError.js";
import { OAuth2Client } from "google-auth-library";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  canResendOTP,
} from "../../utils/otp.js";
import { sendOTPEmail, sendPasswordResetOTP } from "../../config/email.js";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Send OTP for registration
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Success message
 */
export const sendRegisterOTP = async (userData) => {
  const { fullName, email, password, phone } = userData;

  // Validate required fields
  if (!fullName || !email || !password || !phone) {
    throw new AppError(
      "Vui lòng cung cấp đầy đủ họ tên, email, mật khẩu và số điện thoại",
      400,
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email đã được sử dụng", 400);
  }

  // Check if phone number already exists
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new AppError("Số điện thoại đã được sử dụng", 400);
  }

  // Check if can resend OTP
  const { canResend, remainingTime } = canResendOTP(email, "register");
  if (!canResend) {
    throw new AppError(
      `Vui lòng đợi ${remainingTime} giây trước khi gửi lại mã OTP`,
      429,
    );
  }

  // Generate and store OTP
  const otp = generateOTP();
  storeOTP(email, otp, "register", { fullName, email, password, phone });

  // Send OTP email
  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new AppError("Không thể gửi email OTP. Vui lòng thử lại sau", 500);
  }

  return {
    message: "Mã OTP đã được gửi đến email của bạn",
    email,
  };
};

/**
 * Verify OTP and complete registration
 * @param {Object} data - { email, otp }
 * @returns {Promise<Object>} User and token
 */
export const verifyRegisterOTP = async (data) => {
  const { email, otp } = data;

  if (!email || !otp) {
    throw new AppError("Email và mã OTP là bắt buộc", 400);
  }

  // Verify OTP
  const result = verifyOTP(email, otp, "register");

  if (!result.valid) {
    throw new AppError(result.message, 400);
  }

  const { fullName, password, phone } = result.userData;

  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    role: "customer",
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });

  // Generate token
  const token = generateToken({ id: user._id });

  // Remove password from output
  user.password = undefined;

  return { user, token };
};

/**
 * Resend OTP for registration
 * @param {string} email - User email
 * @returns {Promise<Object>} Success message
 */
export const resendRegisterOTP = async (email) => {
  if (!email) {
    throw new AppError("Email là bắt buộc", 400);
  }

  // Check if can resend OTP
  const { canResend, remainingTime } = canResendOTP(email, "register");
  if (!canResend) {
    throw new AppError(
      `Vui lòng đợi ${remainingTime} giây trước khi gửi lại mã OTP`,
      429,
    );
  }

  // Generate new OTP (keep existing userData)
  const otp = generateOTP();

  // We need to get existing userData - for simplicity, require user to start over
  throw new AppError("Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại", 400);
};

/**
 * Send OTP for password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Success message
 */
export const sendForgotPasswordOTP = async (email) => {
  if (!email) {
    throw new AppError("Email là bắt buộc", 400);
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Email không tồn tại trong hệ thống", 404);
  }

  // Check if user registered with social login
  if (user.provider !== "local" && !user.password) {
    throw new AppError(
      `Tài khoản này đăng ký bằng ${user.provider}. Vui lòng đăng nhập bằng ${user.provider}`,
      400,
    );
  }

  // Check if can resend OTP
  const { canResend, remainingTime } = canResendOTP(email, "reset-password");
  if (!canResend) {
    throw new AppError(
      `Vui lòng đợi ${remainingTime} giây trước khi gửi lại mã OTP`,
      429,
    );
  }

  // Generate and store OTP
  const otp = generateOTP();
  storeOTP(email, otp, "reset-password", { userId: user._id });

  // Send OTP email
  try {
    await sendPasswordResetOTP(email, otp);
  } catch (error) {
    console.error("Error sending password reset OTP:", error);
    throw new AppError("Không thể gửi email OTP. Vui lòng thử lại sau", 500);
  }

  return {
    message: "Mã OTP đã được gửi đến email của bạn",
    email,
  };
};

/**
 * Verify OTP for password reset
 * @param {Object} data - { email, otp }
 * @returns {Promise<Object>} Reset token
 */
export const verifyForgotPasswordOTP = async (data) => {
  const { email, otp } = data;

  if (!email || !otp) {
    throw new AppError("Email và mã OTP là bắt buộc", 400);
  }

  // Verify OTP
  const result = verifyOTP(email, otp, "reset-password");

  if (!result.valid) {
    throw new AppError(result.message, 400);
  }

  // Generate a temporary reset token
  const resetToken = generateToken({ email, type: "reset-password" }, "10m");

  return {
    message: "Xác thực OTP thành công",
    resetToken,
    email,
  };
};

/**
 * Reset password with token
 * @param {Object} data - { email, resetToken, newPassword }
 * @returns {Promise<Object>} Success message
 */
export const resetPassword = async (data) => {
  const { email, resetToken, newPassword } = data;

  if (!email || !resetToken || !newPassword) {
    throw new AppError("Email, token và mật khẩu mới là bắt buộc", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 400);
  }

  // Verify reset token
  const jwt = await import("jsonwebtoken");
  try {
    const decoded = jwt.default.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.email !== email || decoded.type !== "reset-password") {
      throw new AppError("Token không hợp lệ", 400);
    }
  } catch (error) {
    throw new AppError("Token không hợp lệ hoặc đã hết hạn", 400);
  }

  // Find and update user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return {
    message: "Đặt lại mật khẩu thành công",
  };
};

/**
 * Register a new user (legacy - now redirects to OTP flow)
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and token
 */
export const register = async (userData) => {
  const { fullName, email, password, phone, role } = userData;

  // Validate required fields
  if (!fullName || !email || !password || !phone) {
    throw new AppError(
      "Please provide full name, email, password, and phone number",
      400,
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // Check if phone number already exists
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new AppError("Phone number already in use", 400);
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    role: role || "customer",
  });

  // Generate token
  const token = generateToken({ id: user._id });

  // Remove password from output
  user.password = undefined;

  return { user, token };
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} User and token
 */
export const login = async (credentials) => {
  const { email, password } = credentials;

  // Check if email and password provided
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Email hoặc mật khẩu sai", 401);
  }

  // Generate token
  const token = generateToken({ id: user._id });

  // Remove password from output
  user.password = undefined;

  return { user, token };
};

/**
 * Logout user - Add token to blacklist
 * @param {String} token - JWT token to invalidate
 * @param {String} userId - User ID
 * @returns {Promise<void>}
 */
export const logout = async (token, userId) => {
  // Add token to blacklist
  await addToBlacklist(token, userId);
};

// In-memory token blacklist (for production, use Redis)
const tokenBlacklist = new Set();

/**
 * Add token to blacklist
 * @param {String} token - JWT token
 * @param {String} userId - User ID
 */
const addToBlacklist = async (token, userId) => {
  tokenBlacklist.add(token);

  // Optional: Clean up expired tokens periodically
  // In production, use Redis with TTL
};

/**
 * Check if token is blacklisted
 * @param {String} token - JWT token
 * @returns {Boolean}
 */
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Verify Google ID Token and return user payload
 * @param {String} idToken - Google ID token from client
 * @returns {Promise<Object>} Google user payload
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new AppError("Invalid Google token", 401);
  }
};

/**
 * Login or register user with Google
 * @param {String} idToken - Google ID token
 * @returns {Promise<Object>} User and token
 */
export const googleAuth = async (idToken) => {
  if (!idToken) {
    throw new AppError("Google ID token is required", 400);
  }

  // Verify Google token
  const googlePayload = await verifyGoogleToken(idToken);

  const { email, name, picture, sub: googleId } = googlePayload;

  if (!email) {
    throw new AppError("Email not provided by Google", 400);
  }

  // Check if user exists with this email
  let user = await User.findOne({ email });

  if (user) {
    // User exists - update Google info if needed
    if (user.provider === "local") {
      // User registered with email/password, link Google account
      user.provider = "google";
      user.providerId = googleId;
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      user.emailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    } else if (user.provider === "google") {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
    }
  } else {
    // Create new user
    user = await User.create({
      email,
      fullName: name || email.split("@")[0],
      avatar: picture,
      provider: "google",
      providerId: googleId,
      emailVerified: true,
      lastLoginAt: new Date(),
      role: "customer",
    });
  }

  // Generate JWT token
  const token = generateToken({ id: user._id });

  // Remove sensitive data
  user.password = undefined;

  return { user, token };
};
