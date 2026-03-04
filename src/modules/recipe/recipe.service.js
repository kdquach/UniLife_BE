import { Recipe } from './recipe.model.js';
import AppError from '../../utils/AppError.js';

// ============ Recipe Services ============

// Them nguyen lieu vao cong thuc
export const addRecipeIngredient = async (data) => {
  const { productId, ingredientId, quantity, description, unit, order } = data;

  const recipe = await Recipe.create({
    productId,
    ingredientId,
    quantity,
    description,
    unit,
    order,
  });

  return recipe.populate([
    { path: 'ingredientId', select: 'name unit stock' },
    { path: 'productId', select: 'name price' },
  ]);
};

// Lay cong thuc theo san pham
export const getRecipeByProduct = async (productId) => {
  const recipes = await Recipe.getRecipeByProduct(productId);
  return recipes;
};

// Cap nhat nguyen lieu trong cong thuc
export const updateRecipeIngredient = async (recipeId, updateData) => {
  const recipe = await Recipe.findByIdAndUpdate(recipeId, updateData, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'ingredientId', select: 'name unit stock' },
    { path: 'productId', select: 'name price' },
  ]);

  if (!recipe) {
    throw new AppError('Không tìm thấy công thức', 404);
  }

  return recipe;
};

// Xoa nguyen lieu khoi cong thuc
export const removeRecipeIngredient = async (recipeId) => {
  const recipe = await Recipe.findByIdAndDelete(recipeId);

  if (!recipe) {
    throw new AppError('Không tìm thấy công thức', 404);
  }
};

// Lay danh sach san pham su dung nguyen lieu
export const getProductsByIngredient = async (ingredientId) => {
  const recipes = await Recipe.getProductsByIngredient(ingredientId);
  return recipes.map((r) => r.productId);
};

// Kiem tra nguyen lieu co du khong
export const checkIngredientsAvailability = async (productId, quantity = 1) => {
  const result = await Recipe.checkIngredientsAvailable(productId, quantity);
  return result;
};

// Batch them nhieu nguyen lieu cho mot mon an
export const batchAddRecipeIngredients = async (productId, ingredients) => {
  const recipes = await Promise.all(
    ingredients.map((ing, index) =>
      Recipe.create({
        productId,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        description: ing.description,
        unit: ing.unit,
        order: ing.order !== undefined ? ing.order : index,
      })
    )
  );

  return Recipe.getRecipeByProduct(productId);
};

// Sao chep cong thuc tu mon an khac
export const cloneRecipe = async (fromProductId, toProductId) => {
  const sourceRecipes = await Recipe.find({ productId: fromProductId });

  if (sourceRecipes.length === 0) {
    throw new AppError('Không tìm thấy công thức nguồn', 404);
  }

  const newRecipes = await Promise.all(
    sourceRecipes.map((recipe) =>
      Recipe.create({
        productId: toProductId,
        ingredientId: recipe.ingredientId,
        quantity: recipe.quantity,
        description: recipe.description,
        unit: recipe.unit,
        order: recipe.order,
      })
    )
  );

  return Recipe.getRecipeByProduct(toProductId);
};

// Xoa tat ca recipe cua mot product (dung khi xoa product)
export const deleteRecipesByProduct = async (productId) => {
  const result = await Recipe.deleteMany({ productId });
  return result;
};

// Xoa tat ca recipe co chua ingredient (dung khi xoa ingredient)
export const deleteRecipesByIngredient = async (ingredientId) => {
  const result = await Recipe.deleteMany({ ingredientId });
  return result;
};
