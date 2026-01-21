import catchAsync from "../../utils/catchAsync.js";
import * as roleService from "./role.service.js";

// ============ Role Controllers ============

export const createRole = catchAsync(async (req, res) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json({ status: "success", data: { role } });
});

export const getAllRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles();
  res
    .status(200)
    .json({ status: "success", results: roles.length, data: { roles } });
});

export const getRoleById = catchAsync(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  res.status(200).json({ status: "success", data: { role } });
});

export const updateRole = catchAsync(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.status(200).json({ status: "success", data: { role } });
});

export const deleteRole = catchAsync(async (req, res) => {
  await roleService.deleteRole(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

// ============ Permission Controllers ============

export const createPermission = catchAsync(async (req, res) => {
  const permission = await roleService.createPermission(req.body);
  res.status(201).json({ status: "success", data: { permission } });
});

export const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await roleService.getAllPermissions();
  res.status(200).json({
    status: "success",
    results: permissions.length,
    data: { permissions },
  });
});

export const getPermissionById = catchAsync(async (req, res) => {
  const permission = await roleService.getPermissionById(req.params.id);
  res.status(200).json({ status: "success", data: { permission } });
});

export const updatePermission = catchAsync(async (req, res) => {
  const permission = await roleService.updatePermission(
    req.params.id,
    req.body,
  );
  res.status(200).json({ status: "success", data: { permission } });
});

export const deletePermission = catchAsync(async (req, res) => {
  await roleService.deletePermission(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

// ============ Role-Permission Controllers ============

export const assignPermissionToRole = catchAsync(async (req, res) => {
  const { roleId, permissionId } = req.body;
  const result = await roleService.assignPermissionToRole(roleId, permissionId);
  res.status(201).json({ status: "success", data: { result } });
});

export const removePermissionFromRole = catchAsync(async (req, res) => {
  const { roleId, permissionId } = req.params;
  await roleService.removePermissionFromRole(roleId, permissionId);
  res.status(204).json({ status: "success", data: null });
});

export const getPermissionsByRole = catchAsync(async (req, res) => {
  const permissions = await roleService.getPermissionsByRole(req.params.roleId);
  res.status(200).json({
    status: "success",
    results: permissions.length,
    data: { permissions },
  });
});

// ============ User-Role Controllers ============

export const assignRoleToUser = catchAsync(async (req, res) => {
  const { userId, roleId } = req.body;
  const result = await roleService.assignRoleToUser(userId, roleId);
  res.status(201).json({ status: "success", data: { result } });
});

export const removeRoleFromUser = catchAsync(async (req, res) => {
  const { userId, roleId } = req.params;
  await roleService.removeRoleFromUser(userId, roleId);
  res.status(204).json({ status: "success", data: null });
});

export const getRolesByUser = catchAsync(async (req, res) => {
  const roles = await roleService.getRolesByUser(req.params.userId);
  res
    .status(200)
    .json({ status: "success", results: roles.length, data: { roles } });
});

export const getUsersByRole = catchAsync(async (req, res) => {
  const users = await roleService.getUsersByRole(req.params.roleId);
  res
    .status(200)
    .json({ status: "success", results: users.length, data: { users } });
});
