import Order from "./order.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/AppError.js";

// Get order history by user
export const getMyOrders = async (userId, queryParams) => {
  const baseFilter = { userId };

  const options = {
    ...filterPresets.order,
    baseFilter,
    populate: [{ path: "canteenId", select: "name location image" }],
  };

  // 1. Lấy dữ liệu thô từ DB (bao gồm cả data rác null canteen)
  const result = await paginatedQuery(Order, queryParams, options);

  // 2. [DEFENSIVE CODING] Lọc bỏ những order bị mất thông tin Canteen
  // Nếu canteenId là null (do populate thất bại) -> Loại bỏ khỏi danh sách
  if (result.data && result.data.length > 0) {
    const validOrders = result.data.filter((order) => {
      // Giữ lại order nếu canteenId tồn tại và không phải null
      return order.canteenId && order.canteenId._id;
    });

    // Cập nhật lại data và total (số lượng có thể giảm đi do lọc)
    result.data = validOrders;

    // Lưu ý: Pagination total có thể bị lệch nhẹ so với thực tế hiển thị
    // nhưng an toàn hơn là hiển thị data lỗi.
  }

  return result;
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {string} userId - User ID creating the order
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData, userId) => {
  const { canteenId, items, payment, note, summary } = orderData;
  console.log("🚀 ~ createOrder ~ orderData:", orderData);

  // Validate and get product prices
  const orderItems = [];
  let totalAmount = 0;
  const canteenObjectId = new mongoose.Types.ObjectId(canteenId);
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }
    if (product.status !== "available") {
      throw new AppError(`Product not available: ${product.name}`, 400);
    }

    orderItems.push({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
    });
    console.log("🚀 ~ createOrder ~ orderItems:", orderItems);

    //Giá đã bao gồm thuế
    totalAmount = summary.total;
    console.log("🚀 ~ createOrder ~ summary:", summary);
  }

  const order = await Order.create({
    userId,
    canteenId: canteenObjectId,
    items: orderItems,
    subTotal: summary.subtotal,
    totalAmount,
    payment: payment || { method: "cash", status: "pending" },
    note,
  });

  return order;
};

/**
 * Get all orders
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Array of orders
 */
export const getAllOrders = async (query = {}) => {
  const filter = {};

  if (query.userId) {
    filter.userId = query.userId;
  }
  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.staffId) {
    filter.staffId = query.staffId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  const orders = await Order.find(filter)
    .populate("userId", "name email")
    .populate("canteenId", "name location")
    .populate("staffId", "name")
    .populate("items.productId", "name image")
    .sort({ createdAt: -1 });

  return orders;
};

/**
 * Get order by ID
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Order object
 */
export const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate("userId", "name email")
    .populate("canteenId", "name location")
    .populate("staffId", "name")
    .populate("items.productId", "name image price");

  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
};

/**
 * Get orders by user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of orders
 */
export const getOrdersByUser = async (userId) => {
  const orders = await Order.find({ userId })
    .populate("canteenId", "name location")
    .populate("items.productId", "name image")
    .sort({ createdAt: -1 });

  return orders;
};

/**
 * Get order by QR code
 * @param {string} code - QR code
 * @returns {Promise<Object>} Order object
 */
export const getOrderByQRCode = async (code) => {
  const order = await Order.findOne({ "pickupQRCode.code": code })
    .populate("userId", "name email")
    .populate("canteenId", "name location")
    .populate("items.productId", "name image");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check if QR code expired
  if (order.pickupQRCode.expireAt < new Date()) {
    throw new AppError("QR code has expired", 400);
  }

  return order;
};

/**
 * Update order status
 * @param {string} id - Order ID
 * @param {string} status - New status
 * @param {string} staffId - Staff ID (optional)
 * @returns {Promise<Object>} Updated order
 */
export const updateOrderStatus = async (id, status, staffId = null) => {
  const updateData = { status };

  if (staffId) {
    updateData.staffId = staffId;
  }

  const order = await Order.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

/**
 * Update payment status
 * @param {string} id - Order ID
 * @param {Object} paymentData - Payment data to update
 * @returns {Promise<Object>} Updated order
 */
export const updatePaymentStatus = async (id, paymentData) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (paymentData.status === "completed") {
    order.payment.status = "completed";
    order.payment.paidAt = new Date();
  } else {
    order.payment.status = paymentData.status;
  }

  if (paymentData.method) {
    order.payment.method = paymentData.method;
  }

  await order.save();

  return order;
};

/**
 * Cancel order
 * @param {string} id - Order ID
 * @param {string} userId - User ID requesting cancellation
 * @returns {Promise<Object>} Cancelled order
 */
export const cancelOrder = async (id, userId) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Only allow cancellation for pending orders
  if (!["pending", "confirmed"].includes(order.status)) {
    throw new AppError("Cannot cancel order in current status", 400);
  }

  // Check if user owns the order or is staff/admin
  if (order.userId.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to cancel this order", 403);
  }

  order.status = "cancelled";
  await order.save();

  return order;
};

/**
 * Complete order (mark as picked up)
 * @param {string} id - Order ID
 * @param {string} staffId - Staff ID
 * @returns {Promise<Object>} Completed order
 */
export const completeOrder = async (id, staffId) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "ready") {
    throw new AppError("Order is not ready for pickup", 400);
  }

  order.status = "completed";
  order.staffId = staffId;
  await order.save();

  return order;
};

/**
 * Get order statistics
 * @param {string} canteenId - Canteen ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Order statistics
 */
export const getOrderStats = async (canteenId, startDate, endDate) => {
  const matchStage = {
    canteenId: new mongoose.Types.ObjectId(canteenId),
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  const stats = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  return stats;
};

// Import mongoose for ObjectId in getOrderStats
import mongoose from "mongoose";
import { Cart } from "../cart/cart.model.js";
import { filterPresets, paginatedQuery } from "../../utils/queryHelper.js";
