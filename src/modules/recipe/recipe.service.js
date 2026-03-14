import Product from '../product/product.model.js';
import { getIngredientById } from '../ingredient/ingredient.service.js';
import AppError from '../../utils/AppError.js';

// ============ Recipe Services ============

// Chuan hoa ObjectId hoac document ve string de so sanh an toan
const normalizeId = (value) => {
  const resolvedValue = value?._id || value;

  if (!resolvedValue) {
    return null;
  }

  return resolvedValue.toString();
};

// Chuan hoa recipe item tra ve
const mapRecipeItem = (item) => ({
  ingredientId: normalizeId(item.ingredientId),
  ingredientName: item.ingredientName,
  quantity: item.quantity,
  unit: item.unit,
});

// Kiem tra user co quyen quan ly recipe khong
const checkUserCanManageRecipe = (user) => {
  if (!user) {
    throw new AppError('Vui lòng đăng nhập', 401);
  }

  if (user.role === 'admin') {
    throw new AppError('Admin không có quyền thao tác với công thức', 403);
  }

  if (!user.canteenId) {
    throw new AppError('Bạn chưa được phân quyền canteen', 403);
  }
};

// Kiem tra user co quyen xem recipe khong
const checkUserCanReadRecipe = (user) => {
  if (!user) {
    throw new AppError('Vui lòng đăng nhập', 401);
  }

  if (!['admin', 'staff', 'manager'].includes(user.role)) {
    throw new AppError('Bạn không có quyền xem công thức', 403);
  }

  if (user.role !== 'admin' && !user.canteenId) {
    throw new AppError('Bạn chưa được phân quyền canteen', 403);
  }
};

// Kiem tra product thuoc canteen cua user
const checkProductAccess = (user, product, allowAdmin = false) => {
  if (allowAdmin && user.role === 'admin') {
    return;
  }

  const productCanteenId = normalizeId(product.canteenId);
  const userCanteenId = normalizeId(user.canteenId);

  if (!userCanteenId) {
    throw new AppError('Bạn chưa được phân quyền canteen', 403);
  }

  if (productCanteenId !== userCanteenId) {
    throw new AppError('Bạn không có quyền thao tác với sản phẩm này', 403);
  }
};

// Lay product va kiem tra quyen truy cap
const getProductForRecipe = async (productId, user, mode = 'read') => {
  const product = await Product.findById(productId).select('recipe canteenId');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (mode === 'manage') {
    checkUserCanManageRecipe(user);
    checkProductAccess(user, product);
  } else {
    checkUserCanReadRecipe(user);
    checkProductAccess(user, product, true);
  }

  return product;
};

// Validate payload tao recipe
const validateCreateRecipePayload = (payload) => {
  const { ingredientId, quantity, unit } = payload;

  if (!ingredientId) {
    throw new AppError('ingredientId là bắt buộc', 400);
  }

  if (quantity === null || quantity === undefined || Number(quantity) <= 0) {
    throw new AppError('quantity phải lớn hơn 0', 400);
  }

  if (unit !== undefined && !String(unit).trim()) {
    throw new AppError('unit không hợp lệ', 400);
  }
};

// Validate payload cap nhat recipe
const validateUpdateRecipePayload = (payload) => {
  const { quantity, unit } = payload;

  if (quantity === undefined && unit === undefined) {
    throw new AppError('Cần ít nhất một trường quantity hoặc unit', 400);
  }

  if (quantity !== undefined && Number(quantity) <= 0) {
    throw new AppError('quantity phải lớn hơn 0', 400);
  }

  if (unit !== undefined && !String(unit).trim()) {
    throw new AppError('unit không hợp lệ', 400);
  }
};

// Lay cong thuc theo san pham
export const getRecipeByProduct = async (productId, user) => {
  const product = await getProductForRecipe(productId, user, 'read');
  return product.recipe.map(mapRecipeItem);
};

// Lay chi tiet mot nguyen lieu trong cong thuc
export const getRecipeDetail = async (productId, ingredientId, user) => {
  const product = await getProductForRecipe(productId, user, 'read');
  const normalizedIngredientId = normalizeId(ingredientId);

  const recipeItem = product.recipe.find(
    (item) => normalizeId(item.ingredientId) === normalizedIngredientId
  );

  if (!recipeItem) {
    throw new AppError('Không tìm thấy nguyên liệu trong công thức', 404);
  }

  return mapRecipeItem(recipeItem);
};

// Them nguyen lieu vao cong thuc
export const addRecipeIngredient = async (productId, payload, user) => {
  validateCreateRecipePayload(payload);

  const product = await getProductForRecipe(productId, user, 'manage');
  const normalizedIngredientId = normalizeId(payload.ingredientId);

  const existed = product.recipe.some(
    (item) => normalizeId(item.ingredientId) === normalizedIngredientId
  );

  if (existed) {
    throw new AppError('Nguyên liệu đã tồn tại trong công thức', 400);
  }

  const ingredient = await getIngredientById(payload.ingredientId);
  const ingredientCanteenId = normalizeId(ingredient.canteenId);
  const productCanteenId = normalizeId(product.canteenId);

  if (ingredientCanteenId !== productCanteenId) {
    throw new AppError(
      'Nguyên liệu không thuộc cùng căng tin với sản phẩm',
      400
    );
  }

  const recipeItem = {
    ingredientId: ingredient._id,
    ingredientName: ingredient.name,
    quantity: Number(payload.quantity),
    unit: payload.unit?.trim() || ingredient.unit,
  };

  await Product.updateOne(
    { _id: productId },
    { $push: { recipe: recipeItem } }
  );

  return recipeItem;
};

// Cap nhat quantity hoac unit cua nguyen lieu trong cong thuc
export const updateRecipeIngredient = async (
  productId,
  ingredientId,
  payload,
  user
) => {
  validateUpdateRecipePayload(payload);
  await getProductForRecipe(productId, user, 'manage');

  const updateData = {};

  if (payload.quantity !== undefined) {
    updateData['recipe.$.quantity'] = Number(payload.quantity);
  }

  if (payload.unit !== undefined) {
    updateData['recipe.$.unit'] = payload.unit.trim();
  }

  const result = await Product.updateOne(
    {
      _id: productId,
      'recipe.ingredientId': ingredientId,
    },
    {
      $set: updateData,
    }
  );

  if (result.matchedCount === 0) {
    throw new AppError('Không tìm thấy nguyên liệu trong công thức', 404);
  }

  const updatedProduct = await Product.findOne(
    {
      _id: productId,
      'recipe.ingredientId': ingredientId,
    },
    {
      recipe: { $elemMatch: { ingredientId } },
    }
  );

  return mapRecipeItem(updatedProduct.recipe[0]);
};

// Xoa nguyen lieu khoi cong thuc
export const removeRecipeIngredient = async (productId, ingredientId, user) => {
  await getProductForRecipe(productId, user, 'manage');

  const result = await Product.updateOne(
    {
      _id: productId,
      'recipe.ingredientId': ingredientId,
    },
    {
      $pull: {
        recipe: {
          ingredientId,
        },
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new AppError('Không tìm thấy nguyên liệu trong công thức', 404);
  }

  return getRecipeByProduct(productId, user);
};
