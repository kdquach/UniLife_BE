import catchAsync from "../../utils/catchAsync.js";
import * as canteenService from "./canteen.service.js";
import AppError from "../../utils/AppError.js";

/**
 * Create a new canteen
 * @route POST /api/canteens
 * @access Private (Admin)
 */
export const createCanteen = catchAsync(async (req, res) => {
  // Không cho tạo thêm nếu user đã có canteen gắn vào tài khoản
  if (req.user?.canteenId) {
    throw new AppError(
      "Tài khoản này đã được gán vào một căng tin. Không thể tạo thêm.",
      400,
    );
  }

  const canteen = await canteenService.createCanteen(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    data: {
      canteen,
    },
  });
});

/**
 * Get all canteens
 * @route GET /api/canteens
 * @access Public
 */
export const getAllCanteens = catchAsync(async (req, res) => {
  const canteens = await canteenService.getAllCanteens(req.query);

  res.status(200).json({
    status: "success",
    results: canteens.length,
    data: {
      canteens,
    },
  });
});

/**
 * Get canteen by ID
 * @route GET /api/canteens/:id
 * @access Public
 */
export const getCanteenById = catchAsync(async (req, res) => {
  const canteen = await canteenService.getCanteenById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      canteen,
    },
  });
});

/**
 * Update canteen
 * @route PATCH /api/canteens/:id
 * @access Private (Admin)
 */
export const updateCanteen = catchAsync(async (req, res) => {
  const canteen = await canteenService.updateCanteen(
    req.params.id,
    req.body,
    req.user,
  );

  res.status(200).json({
    status: "success",
    data: {
      canteen,
    },
  });
});

/**
 * Delete canteen
 * @route DELETE /api/canteens/:id
 * @access Private (Admin)
 */
export const deleteCanteen = catchAsync(async (req, res) => {
  await canteenService.deleteCanteen(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Review canteen registration
 * @route PATCH /api/canteens/:id/review
 * @access Private (Admin)
 */
export const reviewCanteenRegistration = catchAsync(async (req, res) => {
  const { decision } = req.body;

  if (!["approve", "reject"].includes(decision)) {
    throw new AppError("decision phải là approve hoặc reject", 400);
  }

  const result = await canteenService.reviewCanteenRegistration(
    req.params.id,
    decision,
    req.user._id,
  );

  res.status(200).json({
    status: "success",
    message:
      decision === "approve"
        ? "Duyệt đăng ký căng tin thành công"
        : "Từ chối đăng ký căng tin thành công",
    data: {
      canteen: result.canteen,
      reviewedBy: result.reviewedBy,
    },
  });
});
