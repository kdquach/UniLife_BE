import { Role, Permission, RolePermission, UserRole } from "./role.model.js";
import AppError from "../../utils/AppError.js";

// ============ Role Services ============

export const createRole = async (roleData) => {
  const role = await Role.create(roleData);
  return role;
};

export const getAllRoles = async () => {
  const roles = await Role.find().sort({ roleName: 1 });
  return roles;
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError("Role not found", 404);
  }
  return role;
};

export const updateRole = async (id, updateData) => {
  const role = await Role.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!role) {
    throw new AppError("Role not found", 404);
  }
  return role;
};

export const deleteRole = async (id) => {
  const role = await Role.findByIdAndDelete(id);
  if (!role) {
    throw new AppError("Role not found", 404);
  }
  // Clean up related records
  await RolePermission.deleteMany({ roleId: id });
  await UserRole.deleteMany({ roleId: id });
};

// ============ Permission Services ============

export const createPermission = async (permissionData) => {
  const permission = await Permission.create(permissionData);
  return permission;
};

export const getAllPermissions = async () => {
  const permissions = await Permission.find().sort({ code: 1 });
  return permissions;
};

export const getPermissionById = async (id) => {
  const permission = await Permission.findById(id);
  if (!permission) {
    throw new AppError("Permission not found", 404);
  }

  const rolePermissions = await RolePermission.find({ permissionId: id })
    .populate("roleId")
    .sort({ createdAt: -1 });

  const roles = rolePermissions
    .map((rolePermission) => rolePermission.roleId)
    .filter(Boolean);

  return {
    ...permission.toObject(),
    roles,
    roleCount: roles.length,
  };
};

export const updatePermission = async (id, updateData) => {
  const permission = await Permission.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!permission) {
    throw new AppError("Permission not found", 404);
  }
  return permission;
};

export const deletePermission = async (id) => {
  const permission = await Permission.findByIdAndDelete(id);
  if (!permission) {
    throw new AppError("Permission not found", 404);
  }
  await RolePermission.deleteMany({ permissionId: id });
};

// ============ Role-Permission Services ============

export const assignPermissionToRole = async (roleId, permissionId) => {
  const rolePermission = await RolePermission.create({ roleId, permissionId });
  return rolePermission;
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  const result = await RolePermission.findOneAndDelete({
    roleId,
    permissionId,
  });
  if (!result) {
    throw new AppError("Role-Permission assignment not found", 404);
  }
};

export const getPermissionsByRole = async (roleId) => {
  const rolePermissions = await RolePermission.find({ roleId }).populate(
    "permissionId",
  );
  return rolePermissions.map((rp) => rp.permissionId);
};

// ============ User-Role Services ============

export const assignRoleToUser = async (userId, roleId) => {
  if (!userId || !roleId) {
    throw new AppError("User ID and Role ID are required", 400);
  }

  // Single-role policy: replace any existing roles of the user
  await UserRole.deleteMany({ userId });
  const userRole = await UserRole.create({ userId, roleId });
  return userRole;
};

export const removeRoleFromUser = async (userId, roleId) => {
  const result = await UserRole.findOneAndDelete({ userId, roleId });
  if (!result) {
    throw new AppError("User-Role assignment not found", 404);
  }
};

export const getRolesByUser = async (userId) => {
  const userRoles = await UserRole.find({ userId }).populate("roleId");
  return userRoles.map((ur) => ur.roleId);
};

export const getUsersByRole = async (roleId) => {
  const userRoles = await UserRole.find({ roleId }).populate(
    "userId",
    "fullName email",
  );
  return userRoles.map((ur) => ur.userId);
};
