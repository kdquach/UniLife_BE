export const normalizeProductFiles = (files) => {
  if (!files) {
    return [];
  }

  if (Array.isArray(files)) {
    return files;
  }

  const imageFiles = Array.isArray(files.image) ? files.image : [];
  const imagesFiles = Array.isArray(files.images) ? files.images : [];

  return [...imageFiles, ...imagesFiles];
};

export const collectProductImageUrls = (product) => {
  const urls = [];

  if (product?.image) {
    urls.push(product.image);
  }

  if (Array.isArray(product?.images)) {
    urls.push(...product.images);
  }

  return Array.from(new Set(urls));
};
