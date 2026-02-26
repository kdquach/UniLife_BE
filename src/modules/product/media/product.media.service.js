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
    // Sửa: Dùng displayUrl thay vì thumbnailUrl để tránh trùng lặp với images[0]
    image: uploadedImages[0].displayUrl,
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

/**
 * Xử lý merge ảnh mới + ảnh cũ
 * @param {Object} currentProduct - Sản phẩm hiện tại
 * @param {Object} imagePayload - Payload ảnh mới (từ buildProductImagePayload)
 * @param {Array|String} keepImageUrls - Danh sách URL ảnh cũ cần giữ lại
 * @returns {Object} { finalImageUrls, urlsToDelete, image }
 */
export const mergeProductImages = (
  currentProduct,
  imagePayload,
  keepImageUrls
) => {
  const oldImageUrls = getProductImageUrls(currentProduct);
  const newImageUrls = imagePayload
    ? imagePayload.images || [imagePayload.image]
    : [];

  let finalImageUrls = [];
  let urlsToDelete = [];

  if (imagePayload && keepImageUrls !== undefined) {
    // Trường hợp 1: Vừa upload ảnh mới + vừa giữ ảnh cũ
    const keepUrls = Array.isArray(keepImageUrls)
      ? keepImageUrls
      : JSON.parse(keepImageUrls || '[]');

    // Lọc ảnh cũ cần giữ lại
    const keptOldUrls = oldImageUrls.filter((url) => keepUrls.includes(url));

    // Merge: Ảnh cũ được giữ + Ảnh mới
    finalImageUrls = [...keptOldUrls, ...newImageUrls];

    // Ảnh cần xóa = Ảnh cũ KHÔNG nằm trong keepUrls
    urlsToDelete = oldImageUrls.filter((url) => !keepUrls.includes(url));
  } else if (imagePayload) {
    // Trường hợp 2: Chỉ upload ảnh mới, thay thế toàn bộ ảnh cũ
    finalImageUrls = newImageUrls;
    urlsToDelete = oldImageUrls;
  } else if (keepImageUrls !== undefined) {
    // Trường hợp 3: Không upload ảnh mới, chỉ giữ/xóa ảnh cũ
    const keepUrls = Array.isArray(keepImageUrls)
      ? keepImageUrls
      : JSON.parse(keepImageUrls || '[]');

    finalImageUrls = keepUrls.length > 0 ? keepUrls : [];
    urlsToDelete = oldImageUrls.filter((url) => !keepUrls.includes(url));
  } else {
    // Trường hợp 4: Không thay đổi ảnh
    return {
      finalImageUrls: null,
      urlsToDelete: [],
      image: null,
    };
  }

  return {
    finalImageUrls,
    urlsToDelete,
    image: finalImageUrls[0] || null, // Ảnh chính = ảnh đầu tiên
  };
};
