import User from "./user.model.js";
import AppError from "../../utils/AppError.js";
import Canteen from "../canteen/canteen.model.js";
import "../campus/campus.model.js";
import { paginatedQuery, filterPresets } from "../../utils/queryHelper.js";

/**
 * Get all users
 * @returns {Promise<Array>} Array of users
 */
export const getAllUsers = async () => {
  const users = await User.find();
  return users;
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User object
 */
export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (id, updateData) => {
  // Prevent password update through this function
  delete updateData.password;

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * Delete user
 * @param {string} id - User ID
 */
export const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
};

const ensureManagerScope = async (currentUser) => {
  if (!currentUser?._id || currentUser?.role !== "manager") {
    throw new AppError("Bạn không có quyền thực hiện thao tác này", 403);
  }

  if (!currentUser?.canteenId) {
    throw new AppError("Tài khoản manager chưa được gán canteen", 400);
  }

  const canteen = await Canteen.findById(currentUser.canteenId).select("_id campusId status");
  if (!canteen) {
    throw new AppError("Không tìm thấy thông tin canteen của manager", 404);
  }

  return canteen;
};

const buildStaffSafeData = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    gender: user.gender,
    role: user.role,
    status: user.status,
    provider: user.provider,
    emailVerified: user.emailVerified,
    forceChangePassword: user.forceChangePassword,
    campusId: user.campusId,
    canteenId: user.canteenId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Manager - Lấy danh sách staff theo canteen kèm filter
 */
export const getManagerStaffList = async (queryParams = {}, currentUser = null) => {
  const canteen = await ensureManagerScope(currentUser);

  const result = await paginatedQuery(User, queryParams, {
    ...filterPresets.user,
    baseFilter: {
      role: "staff",
      canteenId: canteen._id,
    },
    allowedFilters: ["status", "gender", "emailVerified"],
    allowedSortFields: ["createdAt", "fullName", "email", "status"],
    populate: [
      { path: "canteenId", select: "name location" },
      { path: "campusId", select: "name code" },
    ],
  });

  return {
    ...result,
    data: result.data.map(buildStaffSafeData),
  };
};

/**
 * Manager - Lấy chi tiết 1 staff trong canteen
 */
export const getManagerStaffDetail = async (staffId, currentUser = null) => {
  const canteen = await ensureManagerScope(currentUser);

  const staff = await User.findOne({
    _id: staffId,
    role: "staff",
    canteenId: canteen._id,
  })
    .populate("canteenId", "name location")
    .populate("campusId", "name code address");

  if (!staff) {
    throw new AppError("Không tìm thấy nhân viên trong canteen này", 404);
  }

  return buildStaffSafeData(staff);
};

/**
 * Manager - Tạo tài khoản staff mới
 */
export const createManagerStaff = async (payload = {}, currentUser = null) => {
  const canteen = await ensureManagerScope(currentUser);

  const { email, phone, gender } = payload;
  const fullName = payload?.fullName || payload?.name;
  if (!email || !phone || !fullName || !gender) {
    throw new AppError("Vui lòng cung cấp đầy đủ email, số điện thoại, họ tên và giới tính", 400);
  }

  const existedEmail = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (existedEmail) {
    throw new AppError("Email đã được sử dụng", 400);
  }

  const existedPhone = await User.findOne({ phone: String(phone).trim() });
  if (existedPhone) {
    throw new AppError("Số điện thoại đã được sử dụng", 400);
  }

  const defaultPassword = process.env.STAFF_DEFAULT_PASSWORD || process.env.DEFAULT_STAFF_PASSWORD;
  if (!defaultPassword) {
    throw new AppError("Thiếu cấu hình STAFF_DEFAULT_PASSWORD cho tài khoản nhân viên", 500);
  }

  const staff = await User.create({
    email: String(email).trim().toLowerCase(),
    password: defaultPassword,
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    gender,
    role: "staff",
    status: "active",
    provider: "local",
    emailVerified: true,
    forceChangePassword: true,
    canteenId: canteen._id,
    campusId: canteen.campusId,
  });

  return buildStaffSafeData(staff);
};

/**
 * Manager - Cập nhật thông tin staff
 */
export const updateManagerStaff = async (staffId, payload = {}, currentUser = null) => {
  const canteen = await ensureManagerScope(currentUser);

  const normalizedPayload = { ...payload };
  if (normalizedPayload?.name && !normalizedPayload?.fullName) {
    normalizedPayload.fullName = normalizedPayload.name;
  }

  const allowFields = ["phone", "fullName", "gender", "status"];
  const updateData = Object.entries(normalizedPayload || {}).reduce((acc, [key, value]) => {
    if (allowFields.includes(key) && value !== undefined) {
      acc[key] = typeof value === "string" ? value.trim() : value;
    }
    return acc;
  }, {});

  if (Object.keys(updateData).length === 0) {
    throw new AppError("Không có dữ liệu hợp lệ để cập nhật", 400);
  }

  if (updateData.status && !["active", "inactive"].includes(updateData.status)) {
    throw new AppError("Trạng thái nhân viên chỉ hỗ trợ active hoặc inactive", 400);
  }

  if (updateData.phone) {
    const existedPhone = await User.findOne({
      _id: { $ne: staffId },
      phone: updateData.phone,
    }).select("_id");

    if (existedPhone) {
      throw new AppError("Số điện thoại đã được sử dụng", 400);
    }
  }

  const staff = await User.findOneAndUpdate(
    {
      _id: staffId,
      role: "staff",
      canteenId: canteen._id,
    },
    updateData,
    { new: true, runValidators: true },
  )
    .populate("canteenId", "name location")
    .populate("campusId", "name code");

  if (!staff) {
    throw new AppError("Không tìm thấy nhân viên trong canteen này", 404);
  }

  return buildStaffSafeData(staff);
};
