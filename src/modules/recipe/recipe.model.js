import mongoose from 'mongoose';

// Recipe Schema - Cong thuc che bien mon an
const recipeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID là bắt buộc'],
      index: true,
    },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'Ingredient ID là bắt buộc'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng là bắt buộc'],
      min: [0, 'Số lượng không được âm'],
    },
    unit: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Mô tả không được quá 200 ký tự'],
    },
    // Muc do quan trong cua nguyen lieu trong mon an
    isRequired: {
      type: Boolean,
      default: true,
    },
    // Thu tu sap xep trong cong thuc
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index unique tranh trung lap
recipeSchema.index({ productId: 1, ingredientId: 1 }, { unique: true });

// Compound index cho query theo product
recipeSchema.index({ productId: 1, order: 1 });

// Pre-validate: Kiem tra product va ingredient ton tai
recipeSchema.pre('save', async function (next) {
  const Product = mongoose.model('Product');
  const Ingredient = mongoose.model('Ingredient');

  try {
    const [product, ingredient] = await Promise.all([
      Product.findById(this.productId),
      Ingredient.findById(this.ingredientId),
    ]);

    if (!product) {
      return next(new Error('Sản phẩm không tồn tại'));
    }
    if (!ingredient) {
      return next(new Error('Nguyên liệu không tồn tại'));
    }

    // Tu dong lay unit tu ingredient neu chua co
    if (!this.unit) {
      this.unit = ingredient.unit;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method: Lay tat ca nguyen lieu cua mot mon an
recipeSchema.statics.getRecipeByProduct = function (productId) {
  return this.find({ productId })
    .populate('ingredientId', 'name unit stock lowStockThreshold')
    .populate('productId', 'name price')
    .sort({ order: 1, createdAt: 1 });
};

// Static method: Lay tat ca mon an su dung mot nguyen lieu
recipeSchema.statics.getProductsByIngredient = function (ingredientId) {
  return this.find({ ingredientId })
    .populate('productId', 'name price status image')
    .populate('ingredientId', 'name unit stock')
    .sort({ 'productId.name': 1 });
};

// Static method: Kiem tra nguyen lieu co du de lam mon an khong
recipeSchema.statics.checkIngredientsAvailable = async function (
  productId,
  quantity = 1
) {
  const recipes = await this.find({ productId }).populate(
    'ingredientId',
    'stock name'
  );

  const insufficientIngredients = recipes.filter((recipe) => {
    const requiredQuantity = recipe.quantity * quantity;
    return recipe.ingredientId.stock < requiredQuantity;
  });

  return {
    isAvailable: insufficientIngredients.length === 0,
    insufficientIngredients: insufficientIngredients.map((r) => ({
      ingredientName: r.ingredientId.name,
      required: r.quantity * quantity,
      available: r.ingredientId.stock,
      shortage: r.quantity * quantity - r.ingredientId.stock,
    })),
  };
};

export const Recipe = mongoose.model('Recipe', recipeSchema);
