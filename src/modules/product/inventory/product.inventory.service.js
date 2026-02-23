import mongoose from 'mongoose';
import Product from '../product.model.js';
import { Ingredient } from '../../ingredient/ingredient.model.js';
import AppError from '../../../utils/AppError.js';
import {
  calculateInventoryFromRecipe,
  calculateMaxServingsFromRecipeDetails,
  getRecipeInventoryDetails,
} from './product.inventory.util.js';

// Cập nhật status dựa trên tồn kho
const updateProductStatus = async (productId, session) => {
  const product = await Product.findById(productId)
    .select('stockQuantity status recipe')
    .session(session);

  if (!product) {
    return;
  }

  if (product.recipe && product.recipe.length > 0) {
    return;
  }

  const newStatus = product.stockQuantity === 0 ? 'out_of_stock' : 'available';

  if (product.status !== newStatus) {
    product.status = newStatus;
    await product.save({ session });
  }
};

const normalizeRequestedQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError('So luong yeu cau khong hop le', 400);
  }

  return parsed;
};

/**
 * Trừ kho khi tạo order
 * Sử dụng MongoDB session để đảm bảo atomic transaction
 */
export const deductProductInventory = async (
  productId,
  recipeItems = null,
  orderQuantity = 1
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);

    if (!product) {
      throw new AppError('Sản phẩm không tồn tại', 404);
    }

    // Kiểm tra dùng recipe hay stockQuantity
    if (recipeItems && Array.isArray(recipeItems) && recipeItems.length > 0) {
      // Kiểm tra và trừ từ ingredient
      const inventoryCheck = await calculateInventoryFromRecipe(
        recipeItems,
        orderQuantity
      );

      if (!inventoryCheck || !inventoryCheck.isValid) {
        throw new AppError(
          'Không đủ nguyên liệu. ' +
            (inventoryCheck?.insufficientItems
              ?.map(
                (item) =>
                  `${item.unit}: cần ${item.required}, có ${item.available}`
              )
              ?.join('; ') || 'Kiểm tra lại tồn kho'),
          400
        );
      }

      // Trừ kho từng ingredient
      for (const update of inventoryCheck.updates) {
        const ingredient = await Ingredient.findById(
          update.ingredientId
        ).session(session);

        if (!ingredient) {
          throw new AppError(
            `Nguyên liệu không tồn tại: ${update.ingredientId}`,
            404
          );
        }

        if (ingredient.stock < update.quantityToDeduct) {
          throw new AppError(
            `Không đủ ${ingredient.name}. Cần ${update.quantityToDeduct}, có ${ingredient.stock}`,
            400
          );
        }

        ingredient.stock -= update.quantityToDeduct;
        await ingredient.save({ session });
      }

      // Không giảm product.stockQuantity, vì dùng recipe
    } else {
      // Dùng stockQuantity
      if (product.stockQuantity < orderQuantity) {
        throw new AppError('Hết hàng', 400);
      }

      product.stockQuantity -= orderQuantity;
      await product.save({ session });
    }

    // Đồng bộ status
    await updateProductStatus(productId, session);

    await session.commitTransaction();

    return {
      success: true,
      productId,
      method:
        recipeItems && recipeItems.length > 0 ? 'recipe' : 'stockQuantity',
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Hoàn lại tồn kho khi hủy order
 */
export const restoreProductInventory = async (
  productId,
  recipeItems = null,
  orderQuantity = 1
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);

    if (!product) {
      throw new AppError('Sản phẩm không tồn tại', 404);
    }

    // Hoàn lại theo recipe hay stockQuantity
    if (recipeItems && Array.isArray(recipeItems) && recipeItems.length > 0) {
      // Hoàn lại từng ingredient
      for (const item of recipeItems) {
        const ingredient = await Ingredient.findById(item.ingredientId).session(
          session
        );

        if (!ingredient) {
          throw new AppError(
            `Nguyên liệu không tồn tại: ${item.ingredientId}`,
            404
          );
        }

        ingredient.stock += item.quantity * orderQuantity;
        await ingredient.save({ session });
      }
    } else {
      // Hoàn lại stockQuantity
      product.stockQuantity += orderQuantity;
      await product.save({ session });
    }

    // Đồng bộ status
    await updateProductStatus(productId, session);

    await session.commitTransaction();

    return {
      success: true,
      productId,
      method:
        recipeItems && recipeItems.length > 0 ? 'recipe' : 'stockQuantity',
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Lấy danh sách sản phẩm hết hàng
 */
export const getOutOfStockProducts = async (canteenId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const query = {
    status: 'out_of_stock',
  };

  if (canteenId) {
    query.canteenId = canteenId;
  }

  const products = await Product.find(query)
    .populate('canteenId', 'name')
    .populate('categoryId', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ updatedAt: -1 });

  const total = await Product.countDocuments(query);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy danh sách sản phẩm tồn kho thấp
 */
export const getLowStockProducts = async (canteenId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const query = {
    $expr: {
      $lte: ['$stockQuantity', '$lowStockThreshold'],
    },
    stockQuantity: { $gt: 0 },
    status: { $ne: 'out_of_stock' },
  };

  if (canteenId) {
    query.canteenId = canteenId;
  }

  const products = await Product.find(query)
    .populate('canteenId', 'name')
    .populate('categoryId', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ stockQuantity: 1 });

  const total = await Product.countDocuments(query);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy thông tin tồn kho sản phẩm chi tiết
 */
export const getProductInventoryDetails = async (productId) => {
  const product = await Product.findById(productId).populate(
    'recipe.ingredientId'
  );

  if (!product) {
    throw new AppError('Sản phẩm không tồn tại', 404);
  }

  let inventoryInfo = {
    productId: product._id,
    productName: product.name,
    status: product.status,
    lowStockThreshold: product.lowStockThreshold,
    isLowStock: product.stockQuantity <= product.lowStockThreshold,
    isOutOfStock: product.status === 'out_of_stock',
  };

  // Nếu có recipe, lấy thông tin ingredient
  if (product.recipe && product.recipe.length > 0) {
    inventoryInfo.method = 'recipe';
    inventoryInfo.ingredients = await getRecipeInventoryDetails(product.recipe);
    inventoryInfo.canFulfill = inventoryInfo.ingredients.every(
      (ing) => ing.isAvailable
    );
  } else {
    inventoryInfo.method = 'stockQuantity';
    inventoryInfo.stockQuantity = product.stockQuantity;
    inventoryInfo.canFulfill = product.stockQuantity > 0;
  }

  return inventoryInfo;
};

/**
 * Kiem tra ton kho theo so luong yeu cau (cho khach hang)
 */
export const getProductInventoryCheck = async (
  productId,
  requestedQuantity
) => {
  const quantity = normalizeRequestedQuantity(requestedQuantity);
  const product = await Product.findById(productId).select(
    'name status recipe stockQuantity lowStockThreshold'
  );

  if (!product) {
    throw new AppError('Sản phẩm không tồn tại', 404);
  }

  const isAvailable = product.status === 'available';
  const hasRecipe = Array.isArray(product.recipe) && product.recipe.length > 0;

  const inventoryInfo = {
    productId: product._id,
    productName: product.name,
    status: product.status,
    method: hasRecipe ? 'recipe' : 'stockQuantity',
    requestedQuantity: quantity,
    isAvailable,
    maxServings: 0,
    canFulfill: false,
  };

  if (!isAvailable) {
    return inventoryInfo;
  }

  if (hasRecipe) {
    const ingredients = await getRecipeInventoryDetails(product.recipe);
    const maxServings = calculateMaxServingsFromRecipeDetails(ingredients);

    inventoryInfo.maxServings = maxServings;
    inventoryInfo.canFulfill = maxServings >= quantity;
    return inventoryInfo;
  }

  inventoryInfo.maxServings = product.stockQuantity;
  inventoryInfo.canFulfill = product.stockQuantity >= quantity;

  return inventoryInfo;
};

/**
 * Cập nhật trừ/hoàn kho (batch)
 */
export const batchAdjustInventory = async (adjustments) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = [];

    for (const adj of adjustments) {
      const { productId, quantity, type } = adj; // type: 'deduct' | 'restore'

      const product = await Product.findById(productId).session(session);

      if (!product) {
        throw new AppError(`Sản phẩm không tồn tại: ${productId}`, 404);
      }

      if (type === 'deduct') {
        if (product.stockQuantity < quantity) {
          throw new AppError(`Không đủ tồn kho: ${productId}`, 400);
        }
        product.stockQuantity -= quantity;
      } else if (type === 'restore') {
        product.stockQuantity += quantity;
      }

      await product.save({ session });
      await updateProductStatus(productId, session);
      results.push({ productId, newStock: product.stockQuantity });
    }

    await session.commitTransaction();
    return results;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
