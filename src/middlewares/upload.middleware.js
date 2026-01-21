import multer from "multer";
import AppError from "../utils/AppError.js";
import {
  isValidImageType,
  getFileSizeLimit,
} from "../services/upload.service.js";

/**
 * Multer memory storage configuration
 * Files are stored in memory as Buffer objects
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  if (isValidImageType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
        400,
      ),
      false,
    );
  }
};

/**
 * Create multer upload instance with specific options
 * @param {string} type - Upload type (avatar, banner, product, canteen)
 * @returns {Object} Multer upload instance
 */
const createUploader = (type) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: getFileSizeLimit(type),
    },
  });
};

/**
 * Middleware for uploading a single avatar image
 */
export const uploadAvatar = createUploader("avatar").single("avatar");

/**
 * Middleware for uploading a single banner image
 */
export const uploadBanner = createUploader("banner").single("banner");

/**
 * Middleware for uploading a single product image
 */
export const uploadProductImage = createUploader("product").single("image");

/**
 * Middleware for uploading multiple product images
 */
export const uploadProductImages = createUploader("product").array("images", 5);

/**
 * Middleware for uploading a single canteen image
 */
export const uploadCanteenImage = createUploader("canteen").single("image");

/**
 * Generic single file upload middleware
 * @param {string} fieldName - Form field name
 * @param {string} type - Upload type
 */
export const uploadSingle = (fieldName, type = "product") => {
  return createUploader(type).single(fieldName);
};

/**
 * Generic multiple files upload middleware
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 * @param {string} type - Upload type
 */
export const uploadMultiple = (fieldName, maxCount = 5, type = "product") => {
  return createUploader(type).array(fieldName, maxCount);
};

/**
 * Mixed fields upload middleware
 * @param {Array} fields - Array of field configurations
 * @param {string} type - Upload type
 */
export const uploadFields = (fields, type = "product") => {
  return createUploader(type).fields(fields);
};

/**
 * Error handler middleware for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File size is too large", 400));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new AppError("Too many files uploaded", 400));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new AppError("Unexpected field name", 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};
