import Product from '../product.model.js';
import ProductCategory from '../../productCategory/productCategory.model.js';
import { Ingredient } from '../../ingredient/ingredient.model.js';
import AppError from '../../../utils/AppError.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// const validateCategoryBelongsToCanteen = async (canteenId, categoryId) => {
//   if (!canteenId || !categoryId) {
//     return;
//   }

//   const category = await ProductCategory.findOne({
//     _id: categoryId,
//     canteenId,
//   }).select('_id');

//   if (!category) {
//     throw new AppError('Danh mục không thuộc căng tin', 400);
//   }
// };

const validateUniqueNameInCanteen = async (canteenId, name, excludeId) => {
  if (!canteenId || !name) {
    return;
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    return;
  }

  const query = {
    canteenId,
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const exists = await Product.findOne(query).select('_id');
  if (exists) {
    throw new AppError('Tên sản phẩm đã tồn tại trong căng tin', 400);
  }
};

const validatePriceRule = (price, originalPrice) => {
  // Nếu không có giá gốc hoặc giá gốc <= 0, bỏ qua validation
  if (
    originalPrice === null ||
    originalPrice === undefined ||
    originalPrice <= 0
  ) {
    return;
  }

  if (price === null || price === undefined) {
    return;
  }

  if (originalPrice < price) {
    throw new AppError('Giá gốc phải lớn hơn hoặc bằng giá bán', 400);
  }
};

const validateStockQuantity = (stockQuantity) => {
  if (stockQuantity === null || stockQuantity === undefined) {
    return;
  }

  if (stockQuantity < 0) {
    throw new AppError('Số lượng tồn kho phải lớn hơn hoặc bằng 0', 400);
  }
};

const syncStockStatus = (data, stockQuantity, currentStatus, hasRecipe) => {
  if (hasRecipe) {
    return;
  }

  if (stockQuantity === 0) {
    // Đồng bộ trạng thái hết hàng khi tồn kho bằng 0
    data.status = 'out_of_stock';
    return;
  }

  const desiredStatus = data.status ?? currentStatus;
  if (stockQuantity > 0 && desiredStatus === 'out_of_stock') {
    // Không cho phép hết hàng khi tồn kho vẫn còn
    throw new AppError(
      'Tồn kho lớn hơn 0 không thể để trạng thái hết hàng',
      400
    );
  }
};

// Kiểm tra consistency giữa recipe và stockQuantity
const validateRecipeStockConsistency = (recipe, stockQuantity) => {
  const hasRecipe = Array.isArray(recipe) && recipe.length > 0;

  if (hasRecipe) {
    // Nếu có recipe → stockQuantity phải = 0
    if (stockQuantity && stockQuantity > 0) {
      throw new AppError(
        'Sản phẩm có công thức (recipe) không được set stockQuantity > 0. Tồn kho được quản lý thông qua nguyên liệu',
        400
      );
    }
  } else {
    // Nếu không có recipe → stockQuantity bắt buộc >= 0
    if (
      stockQuantity === null ||
      stockQuantity === undefined ||
      stockQuantity < 0
    ) {
      throw new AppError(
        'Sản phẩm không có công thức (recipe) bắt buộc phải set stockQuantity >= 0',
        400
      );
    }
  }
};

const validateRecipe = async (recipe) => {
  if (!Array.isArray(recipe)) {
    return;
  }

  if (recipe.length === 0) {
    return;
  }

  const ingredientIdList = recipe
    .map((item) => item?.ingredientId?.toString())
    .filter(Boolean);

  if (ingredientIdList.length !== recipe.length) {
    throw new AppError('Nguyên liệu trong công thức không hợp lệ', 400);
  }

  const uniqueIngredientIds = new Set(ingredientIdList);
  if (uniqueIngredientIds.size !== ingredientIdList.length) {
    throw new AppError('Không cho phép trùng nguyên liệu trong công thức', 400);
  }

  recipe.forEach((item) => {
    if (
      item.quantity === null ||
      item.quantity === undefined ||
      item.quantity <= 0
    ) {
      throw new AppError('Số lượng nguyên liệu phải lớn hơn 0', 400);
    }
  });

  const existedCount = await Ingredient.countDocuments({
    _id: { $in: Array.from(uniqueIngredientIds) },
  });

  if (existedCount !== uniqueIngredientIds.size) {
    throw new AppError('Nguyên liệu không tồn tại', 404);
  }
};

export const validateCreateProduct = async (productData) => {
  const canteenId = productData?.canteenId;
  const categoryId = productData?.categoryId;
  const price = productData?.price;
  const originalPrice = productData?.originalPrice;
  const stockQuantity = productData?.stockQuantity ?? 0;
  const recipe = productData?.recipe;
  const hasRecipe = Array.isArray(recipe) && recipe.length > 0;

  // await validateCategoryBelongsToCanteen(canteenId, categoryId);
  await validateUniqueNameInCanteen(canteenId, productData?.name);
  validatePriceRule(price, originalPrice);
  validateStockQuantity(stockQuantity);
  validateRecipeStockConsistency(recipe, stockQuantity);
  syncStockStatus(productData, stockQuantity, productData?.status, hasRecipe);
  await validateRecipe(recipe);

  return productData;
};

export const validateUpdateProduct = async (currentProduct, updateData) => {
  const canteenId = updateData?.canteenId ?? currentProduct?.canteenId;
  const categoryId = updateData?.categoryId ?? currentProduct?.categoryId;
  const price = updateData?.price ?? currentProduct?.price;
  const originalPrice =
    updateData?.originalPrice !== undefined
      ? updateData?.originalPrice
      : currentProduct?.originalPrice;
  const stockQuantity =
    updateData?.stockQuantity ?? currentProduct?.stockQuantity ?? 0;
  const recipe = updateData?.recipe ?? currentProduct?.recipe;
  const hasRecipe = Array.isArray(recipe) && recipe.length > 0;

  // await validateCategoryBelongsToCanteen(canteenId, categoryId);

  if (updateData?.name || updateData?.canteenId) {
    const resolvedName = updateData?.name ?? currentProduct?.name;
    await validateUniqueNameInCanteen(
      canteenId,
      resolvedName,
      currentProduct?._id
    );
  }

  validatePriceRule(price, originalPrice);
  validateStockQuantity(stockQuantity);
  validateRecipeStockConsistency(recipe, stockQuantity);
  syncStockStatus(updateData, stockQuantity, currentProduct?.status, hasRecipe);

  if (updateData?.recipe) {
    await validateRecipe(updateData.recipe);
  }

  return updateData;
};
