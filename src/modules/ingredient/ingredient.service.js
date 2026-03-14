import { Ingredient } from './ingredient.model.js';
import Product from '../product/product.model.js';
import AppError from '../../utils/AppError.js';

// ============ Ingredient Services ============

export const createIngredient = async (data) => {
  const ingredient = await Ingredient.create(data);
  return ingredient;
};

export const getAllIngredients = async (query = {}) => {
  const filter = {};
  if (query.canteenId) filter.canteenId = query.canteenId;
  if (query.categoryId) filter.categoryId = query.categoryId;

  const ingredients = await Ingredient.find(filter)
    .populate('canteenId', 'name')
    .populate('categoryId', 'name')
    .sort({ name: 1 });
  return ingredients;
};

export const getIngredientById = async (id) => {
  const ingredient = await Ingredient.findById(id)
    .populate('canteenId', 'name')
    .populate('categoryId', 'name');
  if (!ingredient) {
    throw new AppError('Không tìm thấy nguyên liệu', 404);
  }
  return ingredient;
};

export const updateIngredient = async (id, updateData) => {
  const ingredient = await Ingredient.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!ingredient) {
    throw new AppError('Không tìm thấy nguyên liệu', 404);
  }
  return ingredient;
};

export const deleteIngredient = async (id) => {
  const ingredient = await Ingredient.findByIdAndDelete(id);
  if (!ingredient) {
    throw new AppError('Không tìm thấy nguyên liệu', 404);
  }

  // Xoa nguyen lieu khoi recipe embedded cua tat ca product
  await Product.updateMany(
    { 'recipe.ingredientId': id },
    {
      $pull: {
        recipe: {
          ingredientId: id,
        },
      },
    }
  );
};

export const updateStock = async (id, quantity, operation = 'add') => {
  const ingredient = await Ingredient.findById(id);
  if (!ingredient) {
    throw new AppError('Không tìm thấy nguyên liệu', 404);
  }

  // Su dung instance method tu model
  try {
    await ingredient.updateStock(quantity, operation);
    return ingredient;
  } catch (error) {
    throw new AppError(error.message || 'Lỗi cập nhật tồn kho', 400);
  }
};

export const getLowStockIngredients = async (canteenId, threshold) => {
  // Su dung static method tu model
  return Ingredient.findLowStock(canteenId, threshold);
};
