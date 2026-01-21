import catchAsync from "../../utils/catchAsync.js";
import * as userService from "./user.service.js";

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin)
 */
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
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
