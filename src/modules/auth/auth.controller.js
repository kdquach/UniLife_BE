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
