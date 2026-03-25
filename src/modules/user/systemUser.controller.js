import catchAsync from "../../utils/catchAsync.js";
import * as systemUserService from "./systemUser.service.js";

/**
 * View System Users — GET /api/users/system
 * @access admin, canteen_owner, manager
 */
export const getSystemUsers = catchAsync(async (req, res) => {
  const result = await systemUserService.getSystemUsers(req.query, req.user);

  res.status(200).json({
    status: "success",
    message: "Lấy danh sách người dùng hệ thống thành công",
    ...result,
  });
});

/**
 * Create System User — POST /api/users/system
 * @access admin, canteen_owner, manager
 */
export const createSystemUser = catchAsync(async (req, res) => {
  const { user, tempPassword } = await systemUserService.createSystemUser(
    req.body,
    req.user
  );

  res.status(201).json({
    status: "success",
    message: "Tạo tài khoản hệ thống thành công",
    data: {
      user,
      // Trả về temp password cho admin để gửi cho user mới
      // Trong production thật: gửi qua email, không trả về response
      tempPassword,
    },
  });
});

/**
 * Update System User — PATCH /api/users/system/:userId
 * @access admin, canteen_owner, manager
 */
export const updateSystemUser = catchAsync(async (req, res) => {
  const result = await systemUserService.updateSystemUser(
    req.params.userId,
    req.body,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * Disable System User — PATCH /api/users/system/:userId/disable
 * @access admin, canteen_owner, manager
 */
export const disableSystemUser = catchAsync(async (req, res) => {
  const result = await systemUserService.disableSystemUser(
    req.params.userId,
    req.body.reason,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * Re-enable System User — PATCH /api/users/system/:userId/reenable
 * @access admin, canteen_owner, manager
 */
export const reenableSystemUser = catchAsync(async (req, res) => {
  const result = await systemUserService.reenableSystemUser(
    req.params.userId,
    req.body.reason,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * Assign Role — PATCH /api/users/system/:userId/role
 * @access admin, canteen_owner, manager
 */
export const assignRole = catchAsync(async (req, res) => {
  const result = await systemUserService.assignRole(
    req.params.userId,
    req.body.role,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * Remove/Downgrade Role — DELETE /api/users/system/:userId/role
 * @access admin, canteen_owner, manager
 */
export const removeRole = catchAsync(async (req, res) => {
  const result = await systemUserService.removeRole(
    req.params.userId,
    req.body.downgradeToRole,
    req.body.reason,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * Reissue Password - PATCH /api/users/system/:userId/reissue-password
 * @access admin, canteen_owner, manager
 */
export const reissuePassword = catchAsync(async (req, res) => {
  const result = await systemUserService.reissuePassword(
    req.params.userId,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});

/**
 * Delete Pending System User - DELETE /api/users/system/:userId
 * @access admin, canteen_owner, manager
 */
export const deletePendingSystemUser = catchAsync(async (req, res) => {
  const result = await systemUserService.deletePendingSystemUser(
    req.params.userId,
    req.user
  );

  res.status(200).json({
    status: "success",
    ...result,
  });
});
