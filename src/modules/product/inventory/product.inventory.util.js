import { Ingredient } from '../../ingredient/ingredient.model.js';

// Tính tồn kho cần trừ dựa trên recipe
export const calculateInventoryFromRecipe = async (recipe, quantity = 1) => {
  if (!recipe || !Array.isArray(recipe) || recipe.length === 0) {
    return null;
  }

  const ingredientIds = recipe.map((item) => item.ingredientId);

  // Lấy thông tin ingredient hiện tại
  const ingredients = await Ingredient.find({
    _id: { $in: ingredientIds },
  }).select('_id stock');

  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  // Kiểm tra đủ tồn kho cho toàn bộ recipe
  const ingredientMap = new Map(
    ingredients.map((ing) => [ing._id.toString(), ing.stock])
  );

  const insufficientItems = recipe.filter((item) => {
    const stock = ingredientMap.get(item.ingredientId.toString()) || 0;
    const required = item.quantity * quantity;
    return stock < required;
  });

  if (insufficientItems.length > 0) {
    return {
      isValid: false,
      insufficientItems: insufficientItems.map((item) => ({
        ingredientId: item.ingredientId,
        required: item.quantity * quantity,
        unit: item.unit,
        available: ingredientMap.get(item.ingredientId.toString()) || 0,
      })),
    };
  }

  // Chuẩn bị dữ liệu update ingredient
  const ingredientUpdates = recipe.map((item) => ({
    ingredientId: item.ingredientId,
    quantityToDeduct: item.quantity * quantity,
    unit: item.unit,
  }));

  return {
    isValid: true,
    updates: ingredientUpdates,
  };
};

// Lấy thông tin tồn kho từ recipe
export const getRecipeInventoryDetails = async (recipe) => {
  if (!recipe || !Array.isArray(recipe) || recipe.length === 0) {
    return [];
  }

  const ingredientIds = recipe.map((item) => item.ingredientId);
  const ingredients = await Ingredient.find({
    _id: { $in: ingredientIds },
  }).select('_id name stock unit');

  const ingredientMap = new Map(
    ingredients.map((ing) => [ing._id.toString(), ing])
  );

  return recipe.map((item) => {
    const ing = ingredientMap.get(item.ingredientId.toString());
    return {
      ingredientId: item.ingredientId,
      ingredientName: ing?.name || 'Unknown',
      requiredQuantity: item.quantity,
      requiredUnit: item.unit,
      availableStock: ing?.stock || 0,
      availableUnit: ing?.unit || item.unit,
      isAvailable: (ing?.stock || 0) >= item.quantity,
    };
  });
};

// Tinh so phan toi da co the lam tu recipe
export const calculateMaxServingsFromRecipeDetails = (ingredients = []) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return 0;
  }

  const maxServingsList = ingredients.map((item) => {
    if (!item?.requiredQuantity || item.requiredQuantity <= 0) {
      return 0;
    }

    return Math.floor((item.availableStock || 0) / item.requiredQuantity);
  });

  return Math.min(...maxServingsList);
};

// Tính toán điểm kiểm kho thấp
export const calculateLowStockThreshold = (baseQuantity = 10) => {
  return baseQuantity;
};
