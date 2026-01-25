import bcrypt from "bcryptjs";
import User from "./profile.model.js";
import AppError from "../../utils/AppError.js";
import {
  uploadImageFromBuffer,
  extractPublicIdFromUrl,
  deleteImage,
} from "../../services/upload.service.js";

export const getProfileById = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateProfileById = async (userId, data) => {
  const allowedFields = ["fullName", "phone", "gender"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");

  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const uploadAvatar = async (userId, file) => {
  if (!file) throw new AppError("Avatar file is required", 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // xóa avatar cũ nếu có
  if (user.avatar) {
    const oldPublicId = extractPublicIdFromUrl(user.avatar);
    if (oldPublicId) await deleteImage(oldPublicId);
  }

  const uploadResult = await uploadImageFromBuffer(
    file.buffer,
    "avatar",
    `avatar_${userId}`
  );

  user.avatar = uploadResult.url;
  await user.save();

  return user;
};