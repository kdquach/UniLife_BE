import catchAsync from "../../utils/catchAsync.js";
import * as uploadService from "../../services/upload.service.js";
import AppError from "../../utils/AppError.js";

/**
 * Upload avatar image
 * @route POST /api/upload/avatar
 */
export const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const result = await uploadService.uploadImageFromBuffer(
    req.file.buffer,
    "avatar",
    `avatar_${req.user._id}`, // Use user ID as public ID for easy replacement
  );

  res.status(200).json({
    status: "success",
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

/**
 * Upload banner image
 * @route POST /api/upload/banner
 */
export const uploadBanner = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const result = await uploadService.uploadImageFromBuffer(
    req.file.buffer,
    "banner",
  );

  res.status(200).json({
    status: "success",
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

/**
 * Upload product image
 * @route POST /api/upload/product
 */
export const uploadProductImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const result = await uploadService.uploadImageFromBuffer(
    req.file.buffer,
    "product",
  );

  res.status(200).json({
    status: "success",
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

/**
 * Upload multiple product images
 * @route POST /api/upload/products
 */
export const uploadProductImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError("No files uploaded", 400));
  }

  const uploadPromises = req.files.map((file) =>
    uploadService.uploadImageFromBuffer(file.buffer, "product"),
  );

  const results = await Promise.all(uploadPromises);

  res.status(200).json({
    status: "success",
    data: {
      images: results.map((result) => ({
        url: result.url,
        publicId: result.publicId,
      })),
    },
  });
});

/**
 * Upload canteen image
 * @route POST /api/upload/canteen
 */
export const uploadCanteenImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const result = await uploadService.uploadImageFromBuffer(
    req.file.buffer,
    "canteen",
  );

  res.status(200).json({
    status: "success",
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

/**
 * Delete an image
 * @route DELETE /api/upload
 */
export const deleteImage = catchAsync(async (req, res, next) => {
  const { publicId } = req.body;

  if (!publicId) {
    return next(new AppError("Public ID is required", 400));
  }

  await uploadService.deleteImage(publicId);

  res.status(200).json({
    status: "success",
    message: "Image deleted successfully",
  });
});

/**
 * Delete multiple images
 * @route DELETE /api/upload/multiple
 */
export const deleteMultipleImages = catchAsync(async (req, res, next) => {
  const { publicIds } = req.body;

  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
    return next(new AppError("Public IDs array is required", 400));
  }

  await uploadService.deleteMultipleImages(publicIds);

  res.status(200).json({
    status: "success",
    message: "Images deleted successfully",
  });
});
