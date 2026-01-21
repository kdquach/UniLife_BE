import { Ingredient, Recipe } from "./ingredient.model.js";
import AppError from "../../utils/AppError.js";

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
    .populate("canteenId", "name")
    .populate("categoryId", "name")
    .sort({ name: 1 });
  return ingredients;
};

export const getIngredientById = async (id) => {
  const ingredient = await Ingredient.findById(id)
    .populate("canteenId", "name")
    .populate("categoryId", "name");
  if (!ingredient) {
    throw new AppError("Ingredient not found", 404);
  }
  return ingredient;
};

export const updateIngredient = async (id, updateData) => {
  const ingredient = await Ingredient.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!ingredient) {
    throw new AppError("Ingredient not found", 404);
  }
  return ingredient;
};

export const deleteIngredient = async (id) => {
  const ingredient = await Ingredient.findByIdAndDelete(id);
  if (!ingredient) {
    throw new AppError("Ingredient not found", 404);
  }
  // Remove related recipes
  await Recipe.deleteMany({ ingredientId: id });
};

export const updateStock = async (id, quantity, operation = "add") => {
  const ingredient = await Ingredient.findById(id);
  if (!ingredient) {
    throw new AppError("Ingredient not found", 404);
  }

  if (operation === "add") {
    ingredient.stock += quantity;
  } else if (operation === "subtract") {
    if (ingredient.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }
    ingredient.stock -= quantity;
  } else {
    ingredient.stock = quantity; // set
  }

  await ingredient.save();
  return ingredient;
};

export const getLowStockIngredients = async (canteenId, threshold = 10) => {
  const ingredients = await Ingredient.find({
    canteenId,
    stock: { $lte: threshold },
  }).sort({ stock: 1 });
  return ingredients;
};

// ============ Recipe Services ============

export const addRecipeIngredient = async (
  productId,
  ingredientId,
  quantity,
  description,
) => {
  const recipe = await Recipe.create({
    productId,
    ingredientId,
    quantity,
    description,
  });
  return recipe;
};

export const getRecipeByProduct = async (productId) => {
  const recipes = await Recipe.find({ productId }).populate(
    "ingredientId",
    "name unit stock",
  );
  return recipes;
};

export const updateRecipeIngredient = async (recipeId, updateData) => {
  const recipe = await Recipe.findByIdAndUpdate(recipeId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!recipe) {
    throw new AppError("Recipe item not found", 404);
  }
  return recipe;
};

export const removeRecipeIngredient = async (recipeId) => {
  const recipe = await Recipe.findByIdAndDelete(recipeId);
  if (!recipe) {
    throw new AppError("Recipe item not found", 404);
  }
};

export const getProductsByIngredient = async (ingredientId) => {
  const recipes = await Recipe.find({ ingredientId }).populate(
    "productId",
    "name price status",
  );
  return recipes.map((r) => r.productId);
};
