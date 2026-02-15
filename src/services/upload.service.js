import cloudinary from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';

/**
 * Upload options for different image types
 */
const uploadPresets = {
  avatar: {
    folder: 'unilife/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  banner: {
    folder: 'unilife/banners',
    transformation: [
      { width: 1920, height: 600, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  product: {
    folder: 'unilife/products',
    transformation: [
      { width: 800, height: 800, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  canteen: {
    folder: 'unilife/canteens',
    transformation: [
      { width: 1200, height: 800, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
};

/**
 * Upload a single image to Cloudinary
 * @param {string} fileBuffer - Base64 encoded file or file path
 * @param {string} type - Type of upload (avatar, banner, product, canteen)
 * @param {string} publicId - Optional custom public ID
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadImage = async (
  fileBuffer,
  type = 'avatar',
  publicId = null
) => {
  const preset = uploadPresets[type];
  if (!preset) {
    throw new AppError(`Invalid upload type: ${type}`, 400);
  }

  const options = {
    folder: preset.folder,
    transformation: preset.transformation,
    allowed_formats: preset.allowed_formats,
    resource_type: 'image',
  };

  if (publicId) {
    options.public_id = publicId;
    options.overwrite = true;
  }

  try {
    const result = await cloudinary.uploader.upload(fileBuffer, options);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new AppError(`Failed to upload image: ${error.message}`, 500);
  }
};

/**
 * Upload image from buffer (for multer memory storage)
 * @param {Buffer} buffer - File buffer
 * @param {string} type - Type of upload
 * @param {string} publicId - Optional custom public ID
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadImageFromBuffer = async (
  buffer,
  type = 'avatar',
  publicId = null
) => {
  const preset = uploadPresets[type];
  if (!preset) {
    throw new AppError(`Invalid upload type: ${type}`, 400);
  }

  const options = {
    folder: preset.folder,
    transformation: preset.transformation,
    allowed_formats: preset.allowed_formats,
    resource_type: 'image',
  };

  if (publicId) {
    options.public_id = publicId;
    options.overwrite = true;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(new AppError(`Failed to upload image: ${error.message}`, 500));
        } else {
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  if (!publicId) {
    throw new AppError('Public ID is required', 400);
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new AppError(`Failed to delete image: ${error.message}`, 500);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteMultipleImages = async (publicIds) => {
  if (!publicIds || !publicIds.length) {
    throw new AppError('Public IDs are required', 400);
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new AppError(`Failed to delete images: ${error.message}`, 500);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) {
      return null;
    }

    let pathPart = url.substring(uploadIndex + 8);
    const versionMatch = pathPart.match(/v\d+\//);

    if (versionMatch) {
      pathPart = pathPart.split(versionMatch[0]).pop();
    } else {
      const pathSegments = pathPart.split('/');
      if (
        pathSegments.length > 1 &&
        (pathSegments[0].includes(',') ||
          pathSegments[0].includes('w_') ||
          pathSegments[0].includes('h_') ||
          pathSegments[0].includes('c_'))
      ) {
        pathSegments.shift();
        pathPart = pathSegments.join('/');
      }
    }

    return pathPart.replace(/\.[a-zA-Z0-9]+$/, '');
  } catch (error) {
    return null;
  }
};

/**
 * Generate optimized URL with transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
  };

  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

/**
 * Generate thumbnail URL
 * @param {string} publicId - Public ID of the image
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (publicId, width = 150, height = 150) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Check if a file is a valid image
 * @param {string} mimetype - File mimetype
 * @returns {boolean}
 */
export const isValidImageType = (mimetype) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(mimetype);
};

/**
 * Get file size limit based on upload type
 * @param {string} type - Upload type
 * @returns {number} Size limit in bytes
 */
export const getFileSizeLimit = (type) => {
  const limits = {
    avatar: 5 * 1024 * 1024, // 5MB
    banner: 10 * 1024 * 1024, // 10MB
    product: 5 * 1024 * 1024, // 5MB
    canteen: 10 * 1024 * 1024, // 10MB
  };
  return limits[type] || 5 * 1024 * 1024;
};
