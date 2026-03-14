import Product from './product.model.js';
import AppError from '../../utils/AppError.js';
import { paginatedQuery, filterPresets } from '../../utils/queryHelper.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
} from './validation/product.validation.service.js';
import {
  buildProductImagePayload,
  deleteProductImagesByUrls,
  deleteProductImagesByPublicIds,
  getProductImageUrls,
  mergeProductImages,
} from './media/product.media.service.js';
import {
  getOutOfStockProducts,
  getLowStockProducts,
  getProductInventoryDetails,
  getProductInventoryCheck,
  deductProductInventory,
  restoreProductInventory,
} from './inventory/product.inventory.service.js';

/**
 * Kiểm tra user có quyền CRUD product không
 * Admin không được CRUD, Staff/Manager phải có canteenId
 */
const checkUserCanCRUD = (user) => {
  if (!user) {
    throw new AppError('Vui lòng đăng nhập', 401);
  }

  // Admin không được CRUD product
  if (user.role === 'admin') {
    throw new AppError('Admin không có quyền thao tác với sản phẩm', 403);
  }

  // Staff/Manager phải có canteenId
  if (!user.canteenId) {
    throw new AppError('Bạn chưa được phân quyền canteen', 403);
  }
};

/**
 * Kiểm tra product có thuộc canteen của user không
 */
const checkProductAccess = (user, product) => {
  if (!user.canteenId) {
    throw new AppError('Bạn chưa được phân quyền canteen', 403);
  }

  // Xử lý canteenId đã được populate hoặc chưa
  const productCanteenId = product.canteenId._id || product.canteenId;

  if (productCanteenId.toString() !== user.canteenId.toString()) {
    throw new AppError('Bạn không có quyền thao tác với sản phẩm này', 403);
  }
};

/**
 * Tạo filter lọc product theo canteen của user
 */
const getCanteenFilterByUser = (user) => {
  // Nếu không có user hoặc user là customer, không lọc (public route)
  if (!user || user.role === 'customer') {
    return {};
  }

  // Admin xem được tất cả (read-only)
  if (user.role === 'admin') {
    return {};
  }

  // Staff/Manager chỉ xem product của canteen mình
  if (user.canteenId) {
    return { canteenId: user.canteenId };
  }

  // User chưa được phân quyền
  throw new AppError('Bạn chưa được phân quyền canteen', 403);
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @param {Object} files - Upload files
 * @param {Object} user - Current user
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData, files, user) => {
  // Kiểm tra quyền CRUD
  checkUserCanCRUD(user);

  // Tự động gắn canteenId từ user (bỏ qua canteenId từ request)
  productData.canteenId = user.canteenId;
  const validatedData = await validateCreateProduct(productData);
  const imagePayload = await buildProductImagePayload(files);

  if (imagePayload) {
    validatedData.image = imagePayload.image;
    validatedData.images = imagePayload.images;
  }

  try {
    const product = await Product.create(validatedData);
    return product;
  } catch (error) {
    if (imagePayload?.publicIds?.length) {
      await deleteProductImagesByPublicIds(imagePayload.publicIds);
    }
    throw error;
  }
};

/**
 * Get all products (với phân quyền theo canteen)
 * @param {Object} queryParams - Query parameters for filtering
 * @param {Object} user - Current user (optional)
 * @returns {Promise<Array>} Array of products
 */
export const getAllProducts = async (queryParams, user = null) => {
  // Lọc theo canteen nếu user là staff/manager
  const baseFilter = user ? getCanteenFilterByUser(user) : {};

  return paginatedQuery(Product, queryParams, {
    ...filterPresets.product,
    baseFilter,
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'canteenId', select: 'name location' },
    ],
  });
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @param {Object} user - Current user (optional)
 * @returns {Promise<Object>} Product object
 */
export const getProductById = async (id, user = null) => {
  const product = await Product.findById(id)
    .populate('categoryId', 'name')
    .populate('canteenId', 'name location');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Nếu user là staff/manager đang thao tác CRUD, kiểm tra quyền
  if (user && (user.role === 'staff' || user.role === 'manager')) {
    checkProductAccess(user, product);
  }

  return product;
};

/**
 * Get products by canteen
 * @param {string} canteenId - Canteen ID
 * @param {Object} queryParams - Query parameters
 * @param {Object} user - Current user (optional)
 * @returns {Promise<Array>} Array of products
 */
export const getProductsByCanteen = async (
  canteenId,
  queryParams,
  user = null
) => {
  // Nếu user là staff/manager đang thao tác, kiểm tra quyền
  if (user && (user.role === 'staff' || user.role === 'manager')) {
    if (!user.canteenId || user.canteenId.toString() !== canteenId.toString()) {
      throw new AppError('Bạn không có quyền truy cập canteen này', 403);
    }
  }

  return paginatedQuery(Product, queryParams, {
    ...filterPresets.product,
    baseFilter: {
      canteenId,
      status: 'available',
    },
    populate: [{ path: 'categoryId', select: 'name' }],
  });
};

/**
 * Search products by canteen
 * @param {string} canteenId
 * @param {Object} queryParams
 * @param {Object} user - Current user (optional)
 */
export const searchProductsByCanteen = async (
  canteenId,
  queryParams,
  user = null
) => {
  if (!canteenId) {
    throw new AppError('CanteenId is required to search products', 400);
  }

  // Nếu user là staff/manager đang thao tác, kiểm tra quyền
  if (user && (user.role === 'staff' || user.role === 'manager')) {
    if (!user.canteenId || user.canteenId.toString() !== canteenId.toString()) {
      throw new AppError('Bạn không có quyền truy cập canteen này', 403);
    }
  }

  const { sort, ...restQuery } = queryParams;

  // ✅ Map sort từ FE → Mongo
  const SORT_MAP = {
    'name-asc': 'name',
    'name-desc': '-name',
    'price-asc': 'price',
    'price-desc': '-price',
    default: '-createdAt',
  };

  const mappedSort = SORT_MAP[sort] || SORT_MAP.default;

  const options = {
    ...filterPresets.product,
    searchFields: ['name'],
    baseFilter: {
      canteenId,
      status: 'available',
    },
    sort: mappedSort,
    populate: [{ path: 'categoryId', select: 'name' }],
  };

  // ❌ không cho override searchFields
  const { searchFields, ...safeQueryParams } = restQuery;

  return paginatedQuery(Product, safeQueryParams, options);
};

/**
 * Update product
 * @param {string} id - Product ID
 * @param {Object} updateData - Data to update
 * @param {Object} files - Upload files
 * @param {Object} user - Current user
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (id, updateData, files, user) => {
  const currentProduct = await Product.findById(id);
  if (!currentProduct) {
    throw new AppError('Product not found', 404);
  }

  // Kiểm tra quyền
  checkUserCanCRUD(user);
  checkProductAccess(user, currentProduct);

  // Không cho phép thay đổi canteenId
  delete updateData.canteenId;

  const validatedData = await validateUpdateProduct(currentProduct, updateData);
  const imagePayload = await buildProductImagePayload(files);

  // Xử lý merge ảnh mới + ảnh cũ
  const imageUpdate = mergeProductImages(
    currentProduct,
    imagePayload,
    updateData.keepImageUrls
  );

  // Cập nhật ảnh nếu có thay đổi
  if (imageUpdate.finalImageUrls !== null) {
    validatedData.image = imageUpdate.image;
    validatedData.images = imageUpdate.finalImageUrls;
  }

  try {
    const product = await Product.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    })
      .populate('categoryId', 'name')
      .populate('canteenId', 'name location');

    //  Xóa ảnh cũ SAU KHI cập nhật DB thành công
    if (imageUpdate.urlsToDelete.length > 0) {
      await deleteProductImagesByUrls(imageUpdate.urlsToDelete);
    }

    return product;
  } catch (error) {
    // Rollback: Xóa ảnh mới nếu cập nhật DB thất bại
    if (imagePayload?.publicIds?.length) {
      await deleteProductImagesByPublicIds(imagePayload.publicIds);
    }
    throw error;
  }
};

/**
 * Delete product (soft delete)
 * @param {string} id - Product ID
 * @param {Object} user - Current user
 */
export const deleteProduct = async (id, user) => {
  const product = await Product.findOne({ _id: id }).setOptions({
    includeDeleted: true,
  });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.isDeleted) {
    throw new AppError('Sản phẩm đã bị xóa', 400);
  }

  // Kiểm tra quyền (chỉ admin hoặc staff/manager của canteen đó)
  if (user.role !== 'admin') {
    checkUserCanCRUD(user);
    checkProductAccess(user, product);
  }

  product.isDeleted = true;
  product.deletedAt = new Date();
  await product.save();
};

/**
 * Lấy danh sách sản phẩm đã xóa (Admin/Manager)
 * @param {Object} queryParams - Tham số truy vấn
 * @param {Object} user - Current user
 * @returns {Promise<Object>} Danh sách sản phẩm đã xóa phân trang
 */
export const getDeletedProducts = async (queryParams, user) => {
  // Lọc theo canteen nếu user là staff/manager
  const canteenFilter =
    user.role === 'admin' ? {} : { canteenId: user.canteenId };

  return paginatedQuery(Product, queryParams, {
    ...filterPresets.product,
    baseFilter: { ...canteenFilter, isDeleted: true },
    mongooseOptions: { includeDeleted: true },
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'canteenId', select: 'name location' },
    ],
  });
};

/**
 * Khôi phục sản phẩm đã xóa (Admin/Manager)
 * @param {string} id - Product ID
 * @param {Object} user - Current user
 * @returns {Promise<Object>} Sản phẩm sau khi khôi phục
 */
export const restoreProduct = async (id, user) => {
  const product = await Product.findOne({ _id: id }).setOptions({
    includeDeleted: true,
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.isDeleted) {
    throw new AppError('Sản phẩm chưa bị xóa', 400);
  }

  // Kiểm tra quyền (chỉ admin hoặc staff/manager của canteen đó)
  if (user.role !== 'admin') {
    checkProductAccess(user, product);
  }

  product.isDeleted = false;
  product.deletedAt = null;
  await product.save();

  // Populate dữ liệu trước khi trả về
  await product.populate('categoryId', 'name');
  await product.populate('canteenId', 'name location');

  return product;
};

/**
 * Inventory Management
 */

export const getOutOfStockListByCanteen = async (canteenId, options, user) => {
  // Kiểm tra quyền (chỉ staff/manager của canteen đó)
  if (
    user &&
    user.canteenId &&
    user.canteenId.toString() !== canteenId.toString()
  ) {
    throw new AppError('Bạn không có quyền truy cập canteen này', 403);
  }
  return getOutOfStockProducts(canteenId, options);
};

export const getLowStockListByCanteen = async (canteenId, options, user) => {
  // Kiểm tra quyền (chỉ staff/manager của canteen đó)
  if (
    user &&
    user.canteenId &&
    user.canteenId.toString() !== canteenId.toString()
  ) {
    throw new AppError('Bạn không có quyền truy cập canteen này', 403);
  }
  return getLowStockProducts(canteenId, options);
};

export const getInventoryDetailsForProduct = async (productId) => {
  return getProductInventoryDetails(productId);
};

export const getInventoryCheckForProduct = async (productId, quantity) => {
  return getProductInventoryCheck(productId, quantity);
};

export const deductInventory = async (productId, recipeItems) => {
  return deductProductInventory(productId, recipeItems);
};

export const restoreInventory = async (productId, recipeItems) => {
  return restoreProductInventory(productId, recipeItems);
};
