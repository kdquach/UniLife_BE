import catchAsync from "../../utils/catchAsync.js";
import * as userService from "./user.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import User from "./user.model.js";

/**
 * Get all users with pagination
 * @route GET /api/users?page=1&limit=10&search=nguyen&role=customer&status=active
 * @access Private (Admin)
 */
export const getAllUsers = catchAsync(async (req, res) => {
  const result = await paginatedQuery(User, req.query, {
    ...filterPresets.user,
    populate: [{ path: "canteenId", select: "name" }],
  });

  res
    .status(200)
    .json(
      formatPaginatedResponse(result, "Lấy danh sách người dùng thành công"),
    );
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * Update user
 * @route PATCH /api/users/:id
 * @access Private
 */
export const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
export const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get current user profile
 * @route GET /api/users/me
 * @access Private
 */
export const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * Manager - Lấy danh sách staff theo canteen
 * @route GET /api/users/staff
 * @access Private (Manager)
 */
export const getManagerStaffList = catchAsync(async (req, res) => {
  const result = await userService.getManagerStaffList(req.query, req.user);

  res
    .status(200)
    .json(formatPaginatedResponse(result, "Lấy danh sách nhân viên thành công"));
});

/**
 * Manager - Lấy chi tiết staff theo canteen
 * @route GET /api/users/staff/:id
 * @access Private (Manager)
 */
export const getManagerStaffDetail = catchAsync(async (req, res) => {
  const staff = await userService.getManagerStaffDetail(req.params.id, req.user);

  res.status(200).json({
    success: true,
    message: "Lấy chi tiết nhân viên thành công",
    data: staff,
  });
});

/**
 * Manager - Tạo tài khoản staff
 * @route POST /api/users/staff
 * @access Private (Manager)
 */
export const createManagerStaff = catchAsync(async (req, res) => {
  const staff = await userService.createManagerStaff(req.body, req.user);

  res.status(201).json({
    success: true,
    message: "Tạo tài khoản nhân viên thành công",
    data: staff,
  });
});

/**
 * Manager - Cập nhật staff (xóa mềm qua status)
 * @route PATCH /api/users/staff/:id
 * @access Private (Manager)
 */
export const updateManagerStaff = catchAsync(async (req, res) => {
  const staff = await userService.updateManagerStaff(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    message: "Cập nhật thông tin nhân viên thành công",
    data: staff,
  });
});
