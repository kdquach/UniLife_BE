import crypto from "crypto";

/**
 * Generate QR Token for order pickup
 * Using a simple 16-byte hex string to make the QR code less dense
 * and easier to scan on mobile devices.
 * @param {string} orderId - Order ID
 * @param {string} orderNumber - Order number (e.g. ORD-20260220-ABC123)
 * @returns {string} Hex token
 */
export const generateQRToken = (orderId, orderNumber) => {
  return crypto.randomBytes(16).toString("hex");
};
