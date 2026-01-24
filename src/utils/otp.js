/**
 * OTP Utility Functions
 * Handles OTP generation, storage, and verification
 */

// In-memory OTP storage (for production, use Redis)
const otpStore = new Map();

// OTP expiration time in milliseconds (5 minutes)
const OTP_EXPIRY = 5 * 60 * 1000;

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP for an email with expiration
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @param {string} type - OTP type ('register' | 'reset-password')
 * @param {Object} userData - Additional user data to store (for registration)
 */
export const storeOTP = (email, otp, type, userData = null) => {
  const key = `${type}:${email}`;
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY,
    userData,
    attempts: 0,
  });

  // Auto-delete OTP after expiration
  setTimeout(() => {
    otpStore.delete(key);
  }, OTP_EXPIRY);
};

/**
 * Verify OTP for an email
 * @param {string} email - User email
 * @param {string} otp - OTP code to verify
 * @param {string} type - OTP type ('register' | 'reset-password')
 * @returns {Object} { valid: boolean, userData: Object|null, message: string }
 */
export const verifyOTP = (email, otp, type) => {
  const key = `${type}:${email}`;
  const stored = otpStore.get(key);

  if (!stored) {
    return {
      valid: false,
      userData: null,
      message: "Mã OTP không tồn tại hoặc đã hết hạn",
    };
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return {
      valid: false,
      userData: null,
      message: "Mã OTP đã hết hạn",
    };
  }

  // Check attempts (max 5 attempts)
  if (stored.attempts >= 5) {
    otpStore.delete(key);
    return {
      valid: false,
      userData: null,
      message: "Đã vượt quá số lần thử. Vui lòng yêu cầu mã OTP mới",
    };
  }

  // Verify OTP
  if (stored.otp !== otp) {
    stored.attempts += 1;
    return {
      valid: false,
      userData: null,
      message: `Mã OTP không chính xác. Còn ${5 - stored.attempts} lần thử`,
    };
  }

  // OTP is valid - delete it after use
  const userData = stored.userData;
  otpStore.delete(key);

  return {
    valid: true,
    userData,
    message: "Xác thực OTP thành công",
  };
};

/**
 * Delete OTP for an email
 * @param {string} email - User email
 * @param {string} type - OTP type
 */
export const deleteOTP = (email, type) => {
  const key = `${type}:${email}`;
  otpStore.delete(key);
};

/**
 * Check if OTP exists and is valid for resend
 * @param {string} email - User email
 * @param {string} type - OTP type
 * @returns {Object} { canResend: boolean, remainingTime: number }
 */
export const canResendOTP = (email, type) => {
  const key = `${type}:${email}`;
  const stored = otpStore.get(key);

  if (!stored) {
    return { canResend: true, remainingTime: 0 };
  }

  // Allow resend after 60 seconds
  const timeSinceCreation = Date.now() - (stored.expiresAt - OTP_EXPIRY);
  const RESEND_COOLDOWN = 60 * 1000; // 60 seconds

  if (timeSinceCreation < RESEND_COOLDOWN) {
    return {
      canResend: false,
      remainingTime: Math.ceil((RESEND_COOLDOWN - timeSinceCreation) / 1000),
    };
  }

  return { canResend: true, remainingTime: 0 };
};
