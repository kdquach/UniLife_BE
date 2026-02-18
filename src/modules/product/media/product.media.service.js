import AppError from '../../../utils/AppError.js';
import {
  deleteMultipleImages,
  extractPublicIdFromUrl,
  getThumbnailUrl,
  uploadImageFromBuffer,
} from '../../../services/upload.service.js';
import {
  collectProductImageUrls,
  normalizeProductFiles,
} from './product.upload.util.js';

const MAX_PRODUCT_IMAGES = 5;
const THUMBNAIL_SIZE = 300;

const uploadSingleProductImage = async (file) => {
  if (!file?.buffer) {
    throw new AppError('Dữ liệu ảnh không hợp lệ', 400);
  }

  const result = await uploadImageFromBuffer(file.buffer, 'product');

  return {
    publicId: result.publicId,
    displayUrl: result.url,
    thumbnailUrl: getThumbnailUrl(
      result.publicId,
      THUMBNAIL_SIZE,
      THUMBNAIL_SIZE
    ),
  };
};

const uploadProductImages = async (files) => {
  if (!files || files.length === 0) {
    return null;
  }

  if (files.length > MAX_PRODUCT_IMAGES) {
    throw new AppError('Tối đa 5 ảnh sản phẩm', 400);
  }

  const settledResults = await Promise.allSettled(
    files.map((file) => uploadSingleProductImage(file))
  );

  const rejected = settledResults.find(
    (result) => result.status === 'rejected'
  );
  const fulfilled = settledResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (rejected) {
    const publicIds = fulfilled.map((item) => item.publicId).filter(Boolean);
    if (publicIds.length > 0) {
      await deleteMultipleImages(publicIds);
    }

    throw rejected.reason;
  }

  return fulfilled;
};

export const buildProductImagePayload = async (files) => {
  const normalizedFiles = normalizeProductFiles(files);
  if (normalizedFiles.length === 0) {
    return null;
  }

  const uploadedImages = await uploadProductImages(normalizedFiles);

  return {
    image: uploadedImages[0].thumbnailUrl,
    images: uploadedImages.map((item) => item.displayUrl),
    publicIds: uploadedImages.map((item) => item.publicId),
  };
};

export const deleteProductImagesByUrls = async (urls = []) => {
  const publicIds = urls
    .map((url) => extractPublicIdFromUrl(url))
    .filter(Boolean);

  if (publicIds.length === 0) {
    return;
  }

  await deleteMultipleImages(publicIds);
};

export const deleteProductImagesByPublicIds = async (publicIds = []) => {
  if (!publicIds || publicIds.length === 0) {
    return;
  }

  await deleteMultipleImages(publicIds);
};

export const getProductImageUrls = (product) => {
  return collectProductImageUrls(product);
};
