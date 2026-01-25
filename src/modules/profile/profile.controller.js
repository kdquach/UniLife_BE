import catchAsync from "../../utils/catchAsync.js";
import * as profileService from "./profile.service.js";

export const viewProfile = catchAsync(async (req, res) => {
  const user = await profileService.getProfileById(req.user.id);
  res.status(200).json({ status: "success", data: user });
});

export const updateProfile = catchAsync(async (req, res) => {
  const user = await profileService.updateProfileById(req.user.id, req.body);
  res.status(200).json({ status: "success", data: user });
});

export const uploadAvatar = catchAsync(async (req, res) => {
  const user = await profileService.uploadAvatar(req.user.id, req.file);
  res.status(200).json({ status: "success", data: user });
});
