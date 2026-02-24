import mongoose from "mongoose";
import Order from "./order.model.js";
import Product from "../product/product.model.js";
import Canteen from "../canteen/canteen.model.js";
import AppError from "../../utils/AppError.js";
import * as voucherService from "../voucher/voucher.service.js";
import { Cart } from "../cart/cart.model.js";
import { filterPresets, paginatedQuery } from "../../utils/queryHelper.js";
import { checkMenuAvailability } from "../menu/menu.service.js";
import {
  deductProductInventory,
  restoreProductInventory,
} from "../product/inventory/product.inventory.service.js";
import { verifyQRToken } from "../../utils/qrToken.js";
import { createNotification } from "../notification/notification.service.js";
import { notifyCanteen, notifyUser } from "../../websocket/notify.js";

const ORDER_STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  ready: "Sẵn sàng nhận món",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const buildOrderStatusNotificationContent = (status, orderNumber) => {
  const normalizedOrderNumber = orderNumber || "---";

  switch (status) {
    case "confirmed":
      return {
        title: "Đơn hàng đã được xác nhận",
        content: `Đơn #${normalizedOrderNumber} đã được quán xác nhận.`,
      };
    case "preparing":
      return {
        title: "Đơn hàng đang được chuẩn bị",
        content: `Đơn #${normalizedOrderNumber} đang được quán chuẩn bị.`,
      };
    case "ready":
      return {
        title: "Đơn hàng đã sẵn sàng",
        content: `Đơn #${normalizedOrderNumber} đã sẵn sàng, mời bạn đến nhận món.`,
      };
    case "completed":
      return {
        title: "Đơn hàng đã hoàn thành",
        content: `Đơn #${normalizedOrderNumber} đã được hoàn tất. Chúc bạn ngon miệng!`,
      };
    case "cancelled":
      return {
        title: "Đơn hàng đã bị hủy",
        content: `Đơn #${normalizedOrderNumber} đã bị hủy. Vui lòng kiểm tra chi tiết đơn hàng.`,
      };
    default:
      return {
        title: "Đơn hàng đã cập nhật trạng thái",
        content: `Đơn #${normalizedOrderNumber} đã chuyển sang trạng thái ${ORDER_STATUS_LABELS[status] || status}.`,
      };
  }
};

const notifyOrderStatusChangedToUser = async ({
  order,
  previousStatus,
  reason = null,
}) => {
  if (!order?.userId || !order?._id || !order?.status) return;
  if (previousStatus === order.status) return;

  try {
    const { title, content } = buildOrderStatusNotificationContent(
      order.status,
      order.orderNumber,
    );

    const notification = await createNotification({
      userId: order.userId,
      canteenId: order.canteenId || null,
      type: "order",
      title,
      content,
      metadata: {
        kind: "order_status_changed",
        orderId: order._id,
        status: order.status,
        previousStatus,
        reason,
      },
    });

    notifyUser(String(order.userId), {
      id: String(notification._id),
      title: notification.title,
      content: notification.content,
      type: "order",
      isRead: false,
      createdAt: notification.createdAt,
      meta: {
        ...(notification.metadata || {}),
        notificationId: String(notification._id),
      },
    });
  } catch (error) {
    console.error("Failed to notify user order status change:", error.message);
  }
};

// Helper: Xử lý inventory khi tạo order
const handleInventoryForOrder = async (orderItems) => {
  const inventoryResults = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.productId).select("recipe");

    if (!product) {
      throw new AppError(`Sản phẩm không tồn tại: ${item.productId}`, 404);
    }

    // Nếu có recipe, sử dụng nó; ngược lại dùng quantity (mỗi product 1 lần order)
    const recipeItems =
      product.recipe && product.recipe.length > 0 ? product.recipe : null;

    try {
      const result = await deductProductInventory(
        item.productId,
        recipeItems,
        item.quantity,
      );
      inventoryResults.push({
        productId: item.productId,
        recipeItems,
        quantity: item.quantity,
        ...result,
      });
    } catch (error) {
      // Rollback đã thành công
      for (const successful of inventoryResults) {
        await restoreProductInventory(
          successful.productId,
          successful.recipeItems,
          successful.quantity,
        );
      }
      throw error;
    }
  }

  return inventoryResults;
};

// Helper: Hoàn lại inventory khi hủy order
const handleInventoryRestoreForOrder = async (orderItems) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.productId).select("recipe");

    if (!product) {
      console.warn(`Sản phẩm không tồn tại khi hoàn kho: ${item.productId}`);
      continue;
    }

    const recipeItems =
      product.recipe && product.recipe.length > 0 ? product.recipe : null;

    try {
      await restoreProductInventory(item.productId, recipeItems, item.quantity);
    } catch (error) {
      console.error(`Lỗi hoàn kho sản phẩm ${item.productId}:`, error.message);
    }
  }
};

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
  const { canteenId, items, payment, note, summary, voucherCode, campusId } =
    orderData;

  // Validate and get product prices
  const orderItems = [];
  let subTotal = 0;
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

    subTotal += item.price * item.quantity;
  }

  // Use summary values if provided
  const finalSubTotal = summary?.subtotal || subTotal;
  let discount = 0;
  let voucherId = null;
  let voucherCodeApplied = null;

  // If voucher code is provided, validate and calculate discount
  if (voucherCode) {
    const voucherResult = await voucherService.validateVoucherForApply(
      voucherCode,
      finalSubTotal,
      orderItems,
      campusId,
      userId,
    );
    discount = voucherResult.discountAmount;
    voucherId = voucherResult.voucher._id;
    voucherCodeApplied = voucherResult.voucher.code;
  }

  // Calculate final total
  const totalAmount = summary?.total || finalSubTotal - discount;

  // Handle inventory deduction BEFORE creating order
  let inventoryResults = null;
  try {
    inventoryResults = await handleInventoryForOrder(orderItems);
  } catch (error) {
    throw new AppError(`Lỗi kiểm tra/trừ tồn kho: ${error.message}`, 400);
  }

  // If voucher is applied, use transaction (Phase 2)
  if (voucherId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create order within transaction
      const [order] = await Order.create(
        [
          {
            userId,
            canteenId: canteenObjectId,
            items: orderItems,
            subTotal: finalSubTotal,
            discount,
            totalAmount,
            voucherId,
            voucherCode: voucherCodeApplied,
            payment: payment || { method: "cash", status: "pending" },
            note,
          },
        ],
        { session },
      );

      // Commit voucher usage atomically
      await voucherService.commitVoucher(
        voucherId,
        order._id,
        userId,
        discount,
        session,
      );

      await session.commitTransaction();
      session.endSession();

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      // Rollback inventory khi order tạo fail
      await handleInventoryRestoreForOrder(orderItems);
      throw error;
    }
  }

  // No voucher - Simple create
  try {
    const order = await Order.create({
      userId,
      canteenId: canteenObjectId,
      items: orderItems,
      subTotal: finalSubTotal,
      discount: 0,
      totalAmount,
      payment: payment || { method: "cash", status: "pending" },
      note,
    });

    return order;
  } catch (error) {
    // Rollback inventory khi order tạo fail
    await handleInventoryRestoreForOrder(orderItems);
    throw error;
  }
};
// order.controller.js
export const confirmOrderFromRedirect = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId },
    { status: "completed" },
    { new: true },
  );

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
    .populate({
      path: "items.productId",
      select: "name image",
      options: { includeDeleted: true },
    })
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
    .populate({
      path: "items.productId",
      select: "name image price",
      options: { includeDeleted: true },
    });

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
    .populate({
      path: "items.productId",
      select: "name image",
      options: { includeDeleted: true },
    })
    .sort({ createdAt: -1 });

  return orders;
};

/**
 * Get order by QR code (JWT token)
 * @param {string} code - QR code (JWT token)
 * @returns {Promise<Object>} Order object
 */
export const getOrderByQRCode = async (code) => {
  // Decode JWT token
  let decoded;
  try {
    decoded = verifyQRToken(code);
  } catch (error) {
    throw new AppError(error.message, 400);
  }

  const order = await Order.findById(decoded.orderId)
    .populate("userId", "name email")
    .populate("canteenId", "name location")
    .populate({
      path: "items.productId",
      select: "name image",
      options: { includeDeleted: true },
    });

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng", 404);
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
export const updateOrderStatus = async (
  id,
  status,
  staffId = null,
  userRole = null,
  staffCanteenId = null,
) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng", 404);
  }

  // Cross-Canteen isolation check
  if (userRole === "staff") {
    const orderCanteen = order.canteenId._id
      ? order.canteenId._id.toString()
      : order.canteenId.toString();
    if (orderCanteen !== staffCanteenId?.toString()) {
      throw new AppError(
        "Bạn không có quyền cập nhật đơn hàng của Canteen khác",
        403,
      );
    }
  }

  const previousStatus = order.status;

  if (status === "cancelled" && previousStatus !== "cancelled") {
    // Hoàn kho khi staff/admin chuyển trạng thái sang cancelled
    await handleInventoryRestoreForOrder(order.items);
  }

  order.status = status;

  if (staffId) {
    order.staffId = staffId;
  }

  await order.save();

  await notifyOrderStatusChangedToUser({
    order,
    previousStatus,
  });

  // Emit WebSocket event for real-time sync
  if (order.canteenId) {
    try {
      const canteenId = order.canteenId._id
        ? order.canteenId._id.toString()
        : order.canteenId.toString();
      notifyCanteen(canteenId, {
        id: `order-${order._id}-${Date.now()}`,
        type: "order",
        title: `Đơn #${order.orderNumber || "---"} cập nhật trạng thái`,
        content: `Đơn hàng chuyển từ ${ORDER_STATUS_LABELS[previousStatus] || previousStatus} sang ${ORDER_STATUS_LABELS[order.status] || order.status}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        meta: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          status: order.status,
          previousStatus,
        },
      });
    } catch (error) {
      console.error("WebSocket notification failed:", error.message);
    }
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

  // Hoàn lại tồn kho
  await handleInventoryRestoreForOrder(order.items);

  order.status = "cancelled";
  await order.save();

  return order;
};

/**
 * Complete order (mark as picked up)
 * Idempotent: if already completed, returns existing order
 * Records audit: scannedBy + scannedAt
 * Optimistic locking via __v prevents concurrent duplicate completion
 * @param {string} id - Order ID
 * @param {string} staffId - Staff ID
 * @returns {Promise<Object>} Completed order
 */
export const completeOrder = async (
  id,
  staffId,
  userRole = null,
  staffCanteenId = null,
) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng", 404);
  }

  // Cross-Canteen isolation check
  if (userRole === "staff") {
    const orderCanteen = order.canteenId._id
      ? order.canteenId._id.toString()
      : order.canteenId.toString();
    if (orderCanteen !== staffCanteenId?.toString()) {
      throw new AppError(
        "Bạn không có quyền xử lý đơn hàng của Canteen khác",
        403,
      );
    }
  }

  // Idempotency: if already completed, return as-is (200 OK)
  if (order.status === "completed") {
    return order;
  }

  if (order.status !== "ready") {
    if (["pending", "confirmed", "preparing"].includes(order.status)) {
      throw new AppError("Món chưa sẵn sàng để trả", 400);
    }
    if (order.status === "cancelled") {
      throw new AppError("Đơn hàng đã bị hủy", 400);
    }
    throw new AppError(
      "Không thể hoàn thành đơn hàng ở trạng thái hiện tại",
      400,
    );
  }

  order.status = "completed";
  order.staffId = staffId;

  // Audit: Record who scanned and when
  if (!order.pickupQRCode) {
    order.pickupQRCode = {};
  }
  order.pickupQRCode.scannedBy = staffId;
  order.pickupQRCode.scannedAt = new Date();

  try {
    await order.save();
  } catch (error) {
    // Optimistic locking: VersionError means another staff already completed
    if (error.name === "VersionError") {
      throw new AppError("Đơn hàng đã được xử lý bởi nhân viên khác", 409);
    }
    throw error;
  }

  await notifyOrderStatusChangedToUser({
    order,
    previousStatus: "ready",
  });

  // Emit WebSocket event for real-time sync
  if (order.canteenId) {
    try {
      const canteenId = order.canteenId._id
        ? order.canteenId._id.toString()
        : order.canteenId.toString();
      notifyCanteen(canteenId, {
        id: `order-${order._id}-${Date.now()}`,
        type: "order",
        title: `Đơn #${order.orderNumber || "---"} đã hoàn thành`,
        content: "Đơn hàng đã được nhân viên xác nhận trả món.",
        isRead: false,
        createdAt: new Date().toISOString(),
        meta: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          status: "completed",
          previousStatus: "ready",
          scannedBy: staffId,
        },
      });
    } catch (error) {
      console.error("WebSocket notification failed:", error.message);
    }
  }

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

/**
 * Scan QR and complete order (combined endpoint)
 * Decodes JWT QR token → validates order → marks as completed
 * @param {string} qrToken - JWT token from QR code
 * @param {string} staffId - Staff ID performing the scan
 * @returns {Promise<Object>} Completed order
 */
export const scanAndCompleteOrder = async (
  qrToken,
  staffId,
  userRole = null,
  staffCanteenId = null,
) => {
  // Step 1: Decode QR token
  let decoded;
  try {
    decoded = verifyQRToken(qrToken);
  } catch (error) {
    throw new AppError(error.message, 400);
  }

  // Step 2: Complete the order
  return await completeOrder(
    decoded.orderId,
    staffId,
    userRole,
    staffCanteenId,
  );
};

/**
 * Manual complete order by order number (fallback when camera fails)
 * @param {string} orderNumber - Order number (e.g. ORD-20260220-ABC123)
 * @param {string} staffId - Staff ID performing the action
 * @returns {Promise<Object>} Completed order
 */
export const manualCompleteOrder = async (
  orderNumber,
  staffId,
  userRole = null,
  staffCanteenId = null,
) => {
  const order = await Order.findOne({ orderNumber });

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng với mã này", 404);
  }

  // Check QR expiration (same end-of-day rule applies to manual entry)
  if (order.pickupQRCode && order.pickupQRCode.expireAt < new Date()) {
    throw new AppError("Mã QR đã hết hạn sử dụng", 400);
  }

  return await completeOrder(
    order._id.toString(),
    staffId,
    userRole,
    staffCanteenId,
  );
};

/**
 * Auto-cancel expired ready orders for canteens past closing time
 * Called by cron job
 * @returns {Promise<Object>} Summary of cancelled orders
 */
export const autoCancelExpiredOrders = async () => {
  const now = new Date();

  // Find canteens whose closingTime + 15 min has passed
  const canteens = await Canteen.find({ status: "active" });

  let totalCancelled = 0;

  for (const canteen of canteens) {
    // Parse closingTime "HH:mm" and add 15 minutes
    const [closeHour, closeMin] = canteen.closingTime.split(":").map(Number);
    const closingPlus15 = closeHour * 60 + closeMin + 15;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes >= closingPlus15) {
      // Find all ready orders for this canteen TODAY
      const readyOrders = await Order.find({
        canteenId: canteen._id,
        status: "ready",
      });

      for (const order of readyOrders) {
        const previousStatus = order.status;
        order.status = "cancelled";
        order.cancelReason =
          "Tự động hủy: Quá giờ đóng cửa, khách không đến nhận";
        await order.save();

        await notifyOrderStatusChangedToUser({
          order,
          previousStatus,
          reason: order.cancelReason,
        });

        // Notify canteen staff
        try {
          notifyCanteen(canteen._id.toString(), {
            id: `order-${order._id}-${Date.now()}`,
            type: "order",
            title: `Đơn #${order.orderNumber || "---"} đã bị hủy`,
            content: "Đơn tự động hủy do quá giờ đóng cửa.",
            isRead: false,
            createdAt: new Date().toISOString(),
            meta: {
              orderId: String(order._id),
              orderNumber: order.orderNumber,
              status: "cancelled",
              previousStatus: "ready",
              cancelReason: order.cancelReason,
            },
          });
        } catch (error) {
          console.error(
            "WebSocket notification failed in cron:",
            error.message,
          );
        }

        totalCancelled++;
      }
    }
  }

  return { totalCancelled, timestamp: now };
};
