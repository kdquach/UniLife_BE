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

  const result = await paginatedQuery(Order, queryParams, options);

  if (result.data && result.data.length > 0) {
    // Bước 1: Lọc bỏ đơn lỗi Canteen
    let validOrders = result.data.filter(
      (order) => order.canteenId && order.canteenId._id,
    );

    // Các trạng thái ĐƯỢC PHÉP xem mã QR
    const ALLOWED_QR_STATUSES = ["pending", "confirmed", "preparing", "ready"];

    validOrders = validOrders.map((order) => {
      // Convert Mongoose Document sang Plain Object để có thể sửa đổi field

      const orderObj = order.toObject ? order.toObject() : order;

      // Nếu trạng thái KHÔNG nằm trong danh sách cho phép -> Xóa field pickupQRCode
      if (!ALLOWED_QR_STATUSES.includes(orderObj.status)) {
        delete orderObj.pickupQRCode;
      }

      return orderObj;
    });

    // Cập nhật lại data
    result.data = validOrders;
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
 * Re-order: Lấy món từ đơn cũ, kiểm tra điều kiện khắt khe, rồi ném vào giỏ hàng.
 * @param {String} userId - ID người dùng
 * @param {String} orderId - ID đơn hàng cũ
 * @param {String} currentCanteenId - Context Canteen hiện tại của User
 */
export const reOrderToCart = async (userId, orderId, currentCanteenId) => {
  // 1. Lấy đơn hàng cũ (Snapshot quá khứ)
  const oldOrder = await Order.findOne({ _id: orderId, userId });
  if (!oldOrder) throw new AppError("Không tìm thấy đơn hàng cũ", 404);

  // 2. Kiểm tra Campus
  // Nếu đơn cũ ở Canteen A, mà User đang đứng ở Canteen B -> Chặn ngay.
  if (oldOrder.canteenId.toString() !== currentCanteenId.toString()) {
    throw new AppError(
      "Không thể đặt lại đơn hàng của Canteen khác khu vực hiện tại.",
      400,
    );
  }

  // 3. Lấy giỏ hàng hiện tại để chuẩn bị Merge
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      canteenId: currentCanteenId,
      items: [],
    });
  } else {
    // Nếu giỏ hàng đang có đồ của Canteen khác -> Cần clear hoặc báo lỗi (Ở đây chọn báo lỗi cho an toàn)
    // Nếu giỏ hàng đang có đồ của Canteen khác -> Cần clear hoặc báo lỗi (Ở đây chọn báo lỗi cho an toàn)
    // Fix crash: Check if canteenId exists before calling toString()
    if (
      cart.canteenId &&
      cart.canteenId.toString() !== currentCanteenId.toString() &&
      cart.items.length > 0
    ) {
      throw new AppError(
        "Giỏ hàng đang chứa món của Canteen khác. Vui lòng thanh toán hoặc xóa giỏ hàng trước.",
        400,
      );
    }

    // Nếu cart.canteenId null hoặc empty items -> Update current canteen
    if (!cart.canteenId || cart.items.length === 0) {
      cart.canteenId = currentCanteenId;
    }
  }

  const report = {
    successItems: [],
    failedItems: [], // Chứa danh sách các món bị loại bỏ (Hết hàng, đổi giá, ngừng bán...)
  };

  // 4. Duyệt qua từng món trong đơn cũ (Vòng lặp Validation)
  for (const item of oldOrder.items) {
    // A. Lấy dữ liệu từ Product DB
    const product = await Product.findById(item.productId);

    // LOGIC KIỂM TRA (VALIDATION CHAIN)

    // Check 1: Product tồn tại và còn Active?
    if (!product || product.status !== "available") {
      report.failedItems.push({
        name: item.productName,
        reason: "Ngừng kinh doanh hoặc đã bị xóa",
      });
      continue;
    }

    // Check 2: Hôm nay có bán không?
    const isAvailableToday = await checkMenuAvailability(
      item.productId,
      currentCanteenId,
    );
    if (!isAvailableToday) {
      report.failedItems.push({
        name: product.name,
        reason: "Hôm nay không phục vụ",
      });
      continue;
    }

    // Check 3: Nếu đặt 3 mà kho còn 1 -> Bỏ luôn (Reject), không tự sửa thành 1.
    if (product.stock < item.quantity) {
      report.failedItems.push({
        name: product.name,
        reason: "Số lượng trong kho không đủ (Yêu cầu: " + item.quantity + ")",
      });
      continue;
    }

    // Check 4: Cảnh báo trượt giá (Optional: Có thể thêm vào report nếu muốn frontend hiện)
    const currentPrice = product.price;

    // B. Merge vào Cart
    const existingItemIndex = cart.items.findIndex(
      (cartItem) => cartItem.productId.toString() === item.productId.toString(),
    );

    if (existingItemIndex > -1) {
      // Nếu món đã có trong giỏ -> Cộng dồn số lượng
      // Cần check lại stock tổng lần nữa cho chắc
      const newQuantity =
        cart.items[existingItemIndex].quantity + item.quantity;
      if (product.stock >= newQuantity) {
        cart.items[existingItemIndex].quantity = newQuantity;
        // Cập nhật giá mới nhất cho item trong giỏ luôn
        cart.items[existingItemIndex].price = currentPrice;
        report.successItems.push(product.name);
      } else {
        report.failedItems.push({
          name: product.name,
          reason: "Tổng số lượng vượt quá tồn kho",
        });
      }
    } else {
      // Nếu món chưa có -> Push mới
      cart.items.push({
        productId: product._id,
        quantity: item.quantity,
        price: currentPrice, // QUAN TRỌNG: Dùng giá hiện tại
        note: item.note || "", // Copy note cũ (nếu có)
      });
      report.successItems.push(product.name);
    }
  }

  // 5. Lưu giỏ hàng
  if (report.successItems.length > 0) {
    await cart.save();
  }

  return report;
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
import { checkMenuAvailability } from "../menu/menu.service.js";
