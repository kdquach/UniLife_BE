import catchAsync from "../../utils/catchAsync.js";
import * as orderService from "./order.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import Order from "./order.model.js";

/**
 * Create a new order
 * @route POST /api/orders
 * @access Private (Customer)
 */
export const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user._id);

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Get all orders with pagination
 * @route GET /api/orders?page=1&limit=10&status=completed&sort=-createdAt
 * @access Private (Staff, Admin)
 */
export const getAllOrders = catchAsync(async (req, res) => {
  const result = await paginatedQuery(Order, req.query, {
    ...filterPresets.order,
    populate: [
      { path: "userId", select: "fullName email phone" },
      { path: "canteenId", select: "name location" },
    ],
  });

  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy danh sách đơn hàng thành công"));
});

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
export const getOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Get my orders (current user) with pagination
 * @route GET /api/orders/my-orders?page=1&limit=10&status=completed
 * @access Private
 */
export const getMyOrders = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const query = req.query;

  // Gọi Service
  const serviceResponse = await orderService.getMyOrders(userId, query);

  const { data, pagination } = serviceResponse;

  res.status(200).json({
    status: "success",
    data: {
      results: data,
      pagination,
    },
  });
});

/**
 * API: POST /api/orders/:id/re-order
 * Body: { currentCanteenId: "..." } -> Frontend cần gửi Canteen user đang đứng
 */
export const reOrder = catchAsync(async (req, res) => {
  const { id } = req.params; // OrderId cũ
  const userId = req.user._id;
  const { currentCanteenId } = req.body; // Bắt buộc phải có để check Context

  if (!currentCanteenId) {
    return res.status(400).json({
      status: "fail",
      message: "Thiếu thông tin Canteen hiện tại (Context Campus).",
    });
  }

  const result = await orderService.reOrderToCart(userId, id, currentCanteenId);

  // Trả về kết quả chi tiết để Frontend hiển thị thông báo
  // Ví dụ: "Đã thêm 3 món vào giỏ. Có 2 món không thành công do hết hàng."
  return res.status(200).json({
    status: "success",
    data: result,
    message:
      result.failedItems.length > 0
        ? `Đã thêm ${result.successItems.length} món. Có ${result.failedItems.length} món không thể thêm (Xem chi tiết).`
        : "Đã thêm toàn bộ món vào giỏ hàng thành công!",
  });
});

/**
 * Get order by QR code
 * @route GET /api/orders/qr/:code
 * @access Private (Staff)
 */
export const getOrderByQRCode = catchAsync(async (req, res) => {
  const order = await orderService.getOrderByQRCode(req.params.code);

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Update order status
 * @route PATCH /api/orders/:id/status
 * @access Private (Staff, Admin)
 */
export const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.user._id,
  );

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Update payment status
 * @route PATCH /api/orders/:id/payment
 * @access Private (Staff, Admin)
 */
export const updatePaymentStatus = catchAsync(async (req, res) => {
  const order = await orderService.updatePaymentStatus(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Cancel order
 * @route PATCH /api/orders/:id/cancel
 * @access Private
 */
export const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Complete order (mark as picked up)
 * @route PATCH /api/orders/:id/complete
 * @access Private (Staff)
 */
export const completeOrder = catchAsync(async (req, res) => {
  const order = await orderService.completeOrder(req.params.id, req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

/**
 * Get order statistics
 * @route GET /api/orders/stats
 * @access Private (Admin)
 */
export const getOrderStats = catchAsync(async (req, res) => {
  const { canteenId, startDate, endDate } = req.query;
  const stats = await orderService.getOrderStats(canteenId, startDate, endDate);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});
