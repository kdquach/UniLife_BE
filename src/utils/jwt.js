import jwt from "jsonwebtoken";

/**
 * Generate JWT token (includes tokenVersion for revocation support)
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate change-password token (short TTL, dùng cho first-login flow)
 * @param {Object} user - User object
 * @returns {string} JWT token with 30m expiry
 */
export const generateChangePasswordToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: "change_password" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
};
