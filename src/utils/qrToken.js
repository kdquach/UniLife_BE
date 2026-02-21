import jwt from "jsonwebtoken";

const getQRSecret = () => process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET;

/**
 * Generate QR Token (JWT) for order pickup
 * Token expires at 00:00:00 of the next day (end-of-day)
 * @param {string} orderId - Order ID
 * @param {string} orderNumber - Order number (e.g. ORD-20260220-ABC123)
 * @returns {string} JWT token
 */
export const generateQRToken = (orderId, orderNumber) => {
  // Calculate expiration: 00:00:00 of the next day
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Seconds remaining until end of day
  const expiresInSeconds = Math.floor(
    (endOfDay.getTime() - now.getTime()) / 1000,
  );

  return jwt.sign(
    {
      orderId,
      orderNumber,
      type: "pickup_qr",
    },
    getQRSecret(),
    {
      expiresIn: expiresInSeconds,
    },
  );
};

/**
 * Verify and decode QR Token
 * @param {string} token - JWT token from QR code
 * @returns {{ orderId: string, orderNumber: string }} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyQRToken = (token) => {
  try {
    const decoded = jwt.verify(token, getQRSecret());

    if (decoded.type !== "pickup_qr") {
      throw new Error("Invalid QR token type");
    }

    return {
      orderId: decoded.orderId,
      orderNumber: decoded.orderNumber,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Mã QR đã hết hạn sử dụng");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Mã QR không hợp lệ");
    }
    throw error;
  }
};
