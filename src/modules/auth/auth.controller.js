import catchAsync from "../../utils/catchAsync.js";
import * as authService from "./auth.service.js";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = catchAsync(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = catchAsync(async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  await authService.logout(token, req.user._id);

  res.status(200).json({
    status: "success",
    message: "Đăng xuất thành công",
  });
});
