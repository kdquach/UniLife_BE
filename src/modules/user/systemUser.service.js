import User from "./user.model.js";
import AuditLog from "../auditLog/auditLog.model.js";
import AppError from "../../utils/AppError.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendSystemUserPasswordEmail } from "../../config/email.js";

// Role hierarchy — số càng cao quyền càng lớn
const ROLE_LEVEL = {
  customer: 0,
  staff: 1,
  manager: 2,
  canteen_owner: 3,
  admin: 4,
};
const SYSTEM_ROLES = ["admin", "canteen_owner", "manager", "staff"];

// ═══════════════════════════════════════════════════════════
// FUNCTION 1: View System Users
// ═══════════════════════════════════════════════════════════

export const getSystemUsers = async (queryParams, currentUser) => {
  // --- Validate & sanitize pagination ---
  const rawPage = parseInt(queryParams.page, 10);
  const rawLimit = parseInt(queryParams.limit, 10);
  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

  // Whitelist sort fields — tránh field injection
  const ALLOWED_SORT_FIELDS = ["email", "fullName", "createdAt", "status", "role"];
  const sortField = ALLOWED_SORT_FIELDS.includes(queryParams.sortBy)
    ? queryParams.sortBy
    : "createdAt";
  const sortOrder = queryParams.sortOrder === "asc" ? 1 : -1;

  // Whitelist status
  const ALLOWED_STATUS = ["active", "inactive", "banned", "pending"];
  const statusFilter = ALLOWED_STATUS.includes(queryParams.status)
    ? queryParams.status
    : undefined;

  // --- Build filter theo scope ---
  const filter = {
    role: { $in: SYSTEM_ROLES }, // chỉ lấy system users
  };

  // Scope check: manager chỉ thấy user trong canteen mình
  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    filter.canteenId = currentUser.canteenId;
  }

  if (statusFilter) filter.status = statusFilter;

  // Role filter (optional)
  if (queryParams.role && SYSTEM_ROLES.includes(queryParams.role)) {
    filter.role = queryParams.role;
  }

  // Search
  if (queryParams.search) {
    const search = queryParams.search.trim();
    if (search.length > 100) {
      throw new AppError("Search query too long (max 100 characters)", 400);
    }
    // Escape regex special chars — tránh ReDoS
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { email: { $regex: escapedSearch, $options: "i" } },
      { fullName: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  // --- Projection theo role ---
  const projection =
    currentUser.role === "admin"
      ? "-password -tokenVersion"
      : "-password -tokenVersion -lastLoginIp -lastLoginAt";

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(projection)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("canteenId", "name location")
      .populate("campusId", "name code"),
    User.countDocuments(filter),
  ]);

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 2: Create System User
// ═══════════════════════════════════════════════════════════

export const createSystemUser = async (payload, currentUser) => {
  // Destructure cụ thể — tránh mass assignment
  const { email, fullName, role, phone, canteenId, campusId, gender } = payload;

  // --- Validate role ---
  if (!SYSTEM_ROLES.includes(role)) {
    throw new AppError("Invalid role", 400);
  }
  // Không assign role cao hơn hoặc bằng mình
  if (ROLE_LEVEL[role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError("Cannot assign role equal or higher than your own", 403);
  }

  // --- Scope check ---
  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 400);
    }
    // Manager chỉ tạo staff trong canteen mình
    if (role !== "staff") {
      throw new AppError("Managers can only create staff accounts", 403);
    }
    if (canteenId && canteenId.toString() !== currentUser.canteenId.toString()) {
      throw new AppError("Out of scope — cannot create user in a different canteen", 403);
    }
  }

  // --- Temp password ---
  const tempPassword = crypto.randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const tempPasswordExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // --- Timing-safe duplicate check ---
  const [existingUser] = await Promise.all([
    User.findOne({ email: email.toLowerCase().trim() }),
    bcrypt.compare(
      "dummy",
      "$2b$12$dummyhashfortimingprotectionxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ),
  ]);

  if (existingUser) {
    // Generic message — không để lộ email đã tồn tại
    throw new AppError(
      "Unable to create account. Please contact administrator.",
      400
    );
  }

  // --- Tạo user ---
  let newUser;
  try {
    newUser = await User.create({
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      role,
      phone: phone || undefined,
      gender: gender || undefined,
      canteenId:
        currentUser.role === "manager"
          ? currentUser.canteenId
          : canteenId || null,
      campusId: campusId || currentUser.campusId || null,
      password: tempPassword, // sẽ được hash bởi pre-save hook
      isTemporaryPassword: true,
      tempPasswordExpiresAt,
      status: "pending",
      provider: "local",
      emailVerified: true,
      forceChangePassword: true,
      createdBy: currentUser._id,
    });
  } catch (err) {
    // Race condition: 2 request tạo cùng email cùng lúc → unique index violation
    if (err.code === 11000) {
      throw new AppError(
        "Unable to create account. Please contact administrator.",
        400
      );
    }
    throw err;
  }

  // Audit log
  await AuditLog.createLog({
    action: "CREATE",
    module: "Người dùng",
    description: `Tạo tài khoản hệ thống: ${newUser.email} (${role})`,
    userId: currentUser._id,
    userName: currentUser.fullName || currentUser.email,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    canteenId: currentUser.canteenId,
    resourceType: "Người dùng",
    resourceId: newUser._id,
    resourceName: newUser.fullName,
    newValues: { email: newUser.email, role, canteenId: newUser.canteenId },
    method: "POST",
    endpoint: "/api/users/system",
    statusCode: 201,
  });

  // Populate data để FE có đủ thông tin (canteen, campus) hiển thị trên bảng ngay sau khi tạo
  const populatedUser = await User.findById(newUser._id)
    .populate("canteenId", "name location")
    .populate("campusId", "name code");

  // Send temp password via email
  try {
    await sendSystemUserPasswordEmail(newUser.email, newUser.fullName, tempPassword, false);
  } catch (emailErr) {
    console.error("Failed to send welcome email:", emailErr);
  }

  // Response KHÔNG chứa tempPassword
  return {
    user: populatedUser,
  };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 3A: Update System User Info
// ═══════════════════════════════════════════════════════════

export const updateSystemUser = async (userId, payload, currentUser) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  // Whitelist fields
  const ALLOWED_UPDATE_FIELDS = ["fullName", "phone", "gender"];
  const updateData = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (payload[field] !== undefined) {
      updateData[field] =
        typeof payload[field] === "string"
          ? payload[field].trim()
          : payload[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  // Không cho update email trực tiếp
  if (payload.email !== undefined) {
    throw new AppError("Email cannot be updated directly", 400);
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new AppError("User not found", 404);

  // Role hierarchy check
  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError("Cannot update user with equal or higher role", 403);
  }

  // Scope check
  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError("Out of scope", 403);
    }
  }

  // Lưu giá trị cũ để log diff
  const previousValues = {};
  for (const field of Object.keys(updateData)) {
    previousValues[field] = targetUser[field];
  }

  await User.findByIdAndUpdate(userId, { $set: updateData });

  // Audit log
  await AuditLog.createLog({
    action: "UPDATE",
    module: "Người dùng",
    description: `Cập nhật thông tin người dùng: ${targetUser.email}`,
    userId: currentUser._id,
    userName: currentUser.fullName || currentUser.email,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    canteenId: currentUser.canteenId,
    resourceType: "Người dùng",
    resourceId: targetUser._id,
    resourceName: targetUser.fullName,
    oldValues: previousValues,
    newValues: updateData,
    method: "PATCH",
    endpoint: `/api/users/system/${userId}`,
    statusCode: 200,
  });

  return { message: "User updated successfully" };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 3B: Disable System User
// ═══════════════════════════════════════════════════════════

export const disableSystemUser = async (userId, reason, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  if (!reason || reason.trim().length < 5) {
    throw new AppError("Disable reason is required (min 5 characters)", 400);
  }

  // Không tự disable chính mình
  if (userId === currentUser._id.toString()) {
    throw new AppError("Cannot disable your own account", 400);
  }

  const targetUser = await User.findById(userId).select("+tokenVersion");
  if (!targetUser) throw new AppError("User not found", 404);

  // Role hierarchy check
  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError("Cannot disable user with equal or higher role", 403);
  }

  // Scope check
  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError("Out of scope", 403);
    }
  }

  // Optimistic update — disable cả ACTIVE lẫn PENDING
  const result = await User.findOneAndUpdate(
    { _id: userId, status: { $in: ["active", "pending"] } },
    {
      $set: {
        status: "inactive",
        disabledAt: new Date(),
        disabledBy: currentUser._id,
        disabledReason: reason.trim(),
      },
      $inc: { tokenVersion: 1 }, // revoke tất cả JWT cũ ngay lập tức
    },
    { new: true }
  );

  if (!result) {
    throw new AppError(
      "User is already disabled or was modified by another request",
      409
    );
  }

  // Audit log
  await AuditLog.createLog({
    action: "UPDATE",
    module: "Người dùng",
    description: `Vô hiệu hóa tài khoản: ${targetUser.email} — Lý do: ${reason.trim()}`,
    userId: currentUser._id,
    userName: currentUser.fullName || currentUser.email,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    canteenId: currentUser.canteenId,
    resourceType: "Người dùng",
    resourceId: targetUser._id,
    resourceName: targetUser.fullName,
    oldValues: { status: targetUser.status },
    newValues: { status: "inactive", disabledReason: reason.trim() },
    method: "PATCH",
    endpoint: `/api/users/system/${userId}/disable`,
    statusCode: 200,
  });

  return { message: "User disabled successfully" };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 3C: Re-enable System User
// ═══════════════════════════════════════════════════════════

export const reenableSystemUser = async (userId, reason, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  if (!reason || reason.trim().length < 5) {
    throw new AppError("Re-enable reason is required (min 5 characters)", 400);
  }

  if (userId === currentUser._id.toString()) {
    throw new AppError("Cannot re-enable your own account", 400);
  }

  const targetUser = await User.findById(userId).select("+tokenVersion");
  if (!targetUser) throw new AppError("User not found", 404);

  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError("Cannot re-enable user with equal or higher role", 403);
  }

  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError("Out of scope", 403);
    }
  }

  const result = await User.findOneAndUpdate(
    { _id: userId, status: "inactive" },
    {
      $set: {
        status: "active",
        reenabledAt: new Date(),
        reenabledBy: currentUser._id,
        disabledAt: null,
        disabledBy: null,
        disabledReason: null,
      },
      $inc: { tokenVersion: 1 }, // phải login lại
    },
    { new: true }
  );

  if (!result) {
    throw new AppError(
      "User is not disabled or was modified by another request",
      409
    );
  }

  // Audit log
  await AuditLog.createLog({
    action: "UPDATE",
    module: "Người dùng",
    description: `Kích hoạt lại tài khoản: ${targetUser.email} — Lý do: ${reason.trim()}`,
    userId: currentUser._id,
    userName: currentUser.fullName || currentUser.email,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    canteenId: currentUser.canteenId,
    resourceType: "Người dùng",
    resourceId: targetUser._id,
    resourceName: targetUser.fullName,
    oldValues: { status: "inactive" },
    newValues: { status: "active" },
    method: "PATCH",
    endpoint: `/api/users/system/${userId}/reenable`,
    statusCode: 200,
  });

  return { message: "User re-enabled successfully. User must login again." };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 4A: Assign Role to User
// ═══════════════════════════════════════════════════════════

export const assignRole = async (userId, newRole, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  if (!SYSTEM_ROLES.includes(newRole)) {
    throw new AppError("Invalid role", 400);
  }

  // Không assign role cao hơn hoặc bằng mình
  if (ROLE_LEVEL[newRole] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError("Cannot assign role equal or higher than your own", 403);
  }

  // Không assign role cho chính mình
  if (userId === currentUser._id.toString()) {
    throw new AppError("Cannot assign role to yourself", 400);
  }

  const targetUser = await User.findById(userId).select("+tokenVersion");
  if (!targetUser) throw new AppError("User not found", 404);

  // Chỉ assign cho user ACTIVE
  if (targetUser.status !== "active") {
    throw new AppError(
      `Cannot assign role to a ${targetUser.status} account`,
      400
    );
  }

  // Scope check
  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError("Out of scope", 403);
    }
  }

  // No-op check
  if (targetUser.role === newRole) {
    throw new AppError("User already has this role", 400);
  }

  // Không thể thay đổi role user có role bằng hoặc cao hơn mình
  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError(
      "Cannot change role of user with equal or higher role",
      403
    );
  }

  const previousRole = targetUser.role;

  await User.findByIdAndUpdate(userId, {
    $set: { role: newRole },
    $inc: { tokenVersion: 1 },
  });

  // Audit log — best-effort
  try {
    await AuditLog.createLog({
      action: "UPDATE",
      module: "Người dùng",
      description: `Gán vai trò: ${targetUser.email} (${previousRole} → ${newRole})`,
      userId: currentUser._id,
      userName: currentUser.fullName || currentUser.email,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      canteenId: currentUser.canteenId,
      resourceType: "Người dùng",
      resourceId: targetUser._id,
      resourceName: targetUser.fullName,
      oldValues: { role: previousRole },
      newValues: { role: newRole },
      method: "PATCH",
      endpoint: `/api/users/system/${userId}/role`,
      statusCode: 200,
    });
  } catch (logErr) {
    console.error("AuditLog failed for ROLE_ASSIGNED:", logErr);
  }

  return { message: `Role updated from ${previousRole} to ${newRole}` };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 4B: Remove / Downgrade Role
// ═══════════════════════════════════════════════════════════

export const removeRole = async (userId, downgradeToRole, reason, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  downgradeToRole = downgradeToRole || "staff"; // default

  if (!reason || reason.trim().length < 5) {
    throw new AppError("Reason for role removal is required", 400);
  }

  const VALID_ROLES = [...SYSTEM_ROLES, "customer"];
  if (!VALID_ROLES.includes(downgradeToRole)) {
    throw new AppError("Invalid target role", 400);
  }

  // Không remove role của chính mình
  if (userId === currentUser._id.toString()) {
    throw new AppError("Cannot remove your own role", 400);
  }

  const targetUser = await User.findById(userId).select("+tokenVersion");
  if (!targetUser) throw new AppError("User not found", 404);

  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError(
      "Cannot remove role of user with equal or higher role",
      403
    );
  }

  // downgradeToRole phải thấp hơn role hiện tại
  if (ROLE_LEVEL[downgradeToRole] >= ROLE_LEVEL[targetUser.role]) {
    throw new AppError("Target role must be lower than current role", 400);
  }

  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError("Out of scope", 403);
    }
  }

  const previousRole = targetUser.role;

  await User.findByIdAndUpdate(userId, {
    $set: { role: downgradeToRole },
    $inc: { tokenVersion: 1 },
  });

  // Audit log — best-effort
  try {
    await AuditLog.createLog({
      action: "UPDATE",
      module: "Người dùng",
      description: `Hạ vai trò: ${targetUser.email} (${previousRole} → ${downgradeToRole}) — Lý do: ${reason.trim()}`,
      userId: currentUser._id,
      userName: currentUser.fullName || currentUser.email,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      canteenId: currentUser.canteenId,
      resourceType: "Người dùng",
      resourceId: targetUser._id,
      resourceName: targetUser.fullName,
      oldValues: { role: previousRole },
      newValues: { role: downgradeToRole, reason: reason.trim() },
      method: "DELETE",
      endpoint: `/api/users/system/${userId}/role`,
      statusCode: 200,
    });
  } catch (logErr) {
    console.error("AuditLog failed for ROLE_REMOVED:", logErr);
  }

  return {
    message: `Role downgraded from ${previousRole} to ${downgradeToRole}`,
  };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 4C: Reissue Password
// ═══════════════════════════════════════════════════════════

export const reissuePassword = async (userId, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new AppError("User not found", 404);

  // Không cấp lại mật khẩu cho chính mình (để tránh bypass reset password flow chuẩn)
  if (userId === currentUser._id.toString()) {
    throw new AppError("Cannot reissue password for your own account", 400);
  }

  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError(
      "Cannot reissue password for user with equal or higher role",
      403
    );
  }

  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError("Out of scope", 403);
    }
  }

  const tempPassword = crypto.randomBytes(12).toString("base64url");
  
  targetUser.password = tempPassword; // Will be hashed by pre-save hook
  targetUser.isTemporaryPassword = true;
  targetUser.tempPasswordExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  targetUser.status = "pending";
  targetUser.forceChangePassword = true;
  targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1; // Invalidate all existing tokens

  await targetUser.save();

  // Audit log
  try {
    await AuditLog.createLog({
      action: "UPDATE",
      module: "Người dùng",
      description: `Cấp lại mật khẩu tạm thời cho: ${targetUser.email}`,
      userId: currentUser._id,
      userName: currentUser.fullName || currentUser.email,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      canteenId: currentUser.canteenId,
      resourceType: "Người dùng",
      resourceId: targetUser._id,
      resourceName: targetUser.fullName,
      oldValues: { status: "active" },
      newValues: { status: "pending", action: "reissued_password" },
      method: "PATCH",
      endpoint: `/api/users/system/${userId}/reissue-password`,
      statusCode: 200,
    });
  } catch (logErr) {
    console.error("AuditLog failed for REISSUE_PASSWORD:", logErr);
  }

  // Send new pass via email
  try {
    await sendSystemUserPasswordEmail(
      targetUser.email, 
      targetUser.fullName, 
      tempPassword, 
      true
    );
  } catch (emailErr) {
    console.error("Failed to send reissue password email:", emailErr);
    throw new AppError("Password reissued but failed to send email", 500);
  }

  return { message: "Password reissued successfully. A new password has been emailed to the user." };
};

// ═══════════════════════════════════════════════════════════
// FUNCTION 4D: Delete Pending System User
// ═══════════════════════════════════════════════════════════

export const deletePendingSystemUser = async (userId, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID format", 400);
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new AppError("User not found", 404);

  if (userId === currentUser._id.toString()) {
    throw new AppError("Cannot delete your own account", 400);
  }

  // Chỉ cho phép xóa user trạng thái pending
  if (targetUser.status !== "pending") {
    throw new AppError(
      "Only users with 'pending' status can be deleted. Please disable active users instead.",
      400
    );
  }

  // Phân quyền theo cấp bậc (Role Hierarchy)
  if (ROLE_LEVEL[targetUser.role] >= ROLE_LEVEL[currentUser.role]) {
    throw new AppError("Cannot delete user with equal or higher role", 403);
  }

  // Scope check (Manager chỉ xóa trong canteen của mình)
  if (currentUser.role === "manager") {
    if (!currentUser.canteenId) {
      throw new AppError("Your account has no canteen assigned", 403);
    }
    if (
      !targetUser.canteenId ||
      targetUser.canteenId.toString() !== currentUser.canteenId.toString()
    ) {
      throw new AppError(
        "Out of scope — you can only delete users in your own canteen",
        403
      );
    }
  }

  // Lấy data cũ để log trước khi xóa
  const oldDataSnapshot = {
    email: targetUser.email,
    role: targetUser.role,
    status: targetUser.status,
    canteenId: targetUser.canteenId,
  };

  await User.findByIdAndDelete(userId);

  // Audit log
  try {
    await AuditLog.createLog({
      action: "DELETE",
      module: "Người dùng",
      description: `Đã xóa tài khoản user chưa kích hoạt: ${targetUser.email}`,
      userId: currentUser._id,
      userName: currentUser.fullName || currentUser.email,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      canteenId: currentUser.canteenId,
      resourceType: "Người dùng",
      resourceId: targetUser._id,
      resourceName: targetUser.fullName,
      oldValues: oldDataSnapshot,
      method: "DELETE",
      endpoint: `/api/users/system/${userId}`,
      statusCode: 200,
    });
  } catch (logErr) {
    console.error("AuditLog failed for DELETE_PENDING_USER:", logErr);
  }

  return { message: "Pending user deleted successfully." };
};
