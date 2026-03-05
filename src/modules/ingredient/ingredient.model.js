import mongoose from 'mongoose';

// Danh sach don vi hop le cho nguyen lieu
const VALID_UNITS = ['kg', 'g', 'lit', 'lít', 'ml', 'cái', 'gói', 'hộp', 'lon'];

// Ingredient Schema
const ingredientSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      required: [true, 'Canteen ID là bắt buộc'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IngredientCategory',
      required: [true, 'Category ID là bắt buộc'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên nguyên liệu là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên nguyên liệu không được quá 100 ký tự'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng tồn kho không được âm'],
    },
    unit: {
      type: String,
      required: [true, 'Đơn vị là bắt buộc'],
      trim: true,
      enum: {
        values: VALID_UNITS,
        message: `Đơn vị phải là một trong: ${VALID_UNITS.join(', ')}`,
      },
    },
    // Nguong canh bao het hang cho tung nguyen lieu
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Ngưỡng cảnh báo không được âm'],
    },
    // Trang thai hoat dong
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes cho performance
ingredientSchema.index({ canteenId: 1, name: 1 }, { unique: true }); // Unique trong cung canteen
ingredientSchema.index({ categoryId: 1 });
ingredientSchema.index({ stock: 1 }); // Index cho truy van low stock
ingredientSchema.index({ canteenId: 1, stock: 1 }); // Compound index cho filter canteen + stock
ingredientSchema.index({ canteenId: 1, isActive: 1 }); // Filter active ingredients
ingredientSchema.index({ isActive: 1 });

// Pre-save middleware: Normalize unit từ "lit" thành "lít"
ingredientSchema.pre('save', function (next) {
  if (this.unit === 'lit') {
    this.unit = 'lít';
  }
  next();
});

// Pre-update middleware: Normalize unit
ingredientSchema.pre('findOneAndUpdate', function (next) {
  if (this._update && this._update.unit === 'lit') {
    this._update.unit = 'lít';
  }
  next();
});

// Virtual: Kiem tra nguyen lieu sap het
ingredientSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

// Instance method: Cap nhat stock
ingredientSchema.methods.updateStock = function (quantity, operation = 'add') {
  if (operation === 'add') {
    this.stock += quantity;
  } else if (operation === 'subtract') {
    if (this.stock < quantity) {
      throw new Error('Số lượng tồn kho không đủ');
    }
    this.stock -= quantity;
  } else if (operation === 'set') {
    this.stock = quantity;
  }
  return this.save();
};

// Static method: Tim nguyen lieu sap het theo canteen
ingredientSchema.statics.findLowStock = function (canteenId, customThreshold) {
  const query = customThreshold
    ? { canteenId, stock: { $lte: customThreshold }, isActive: true }
    : {
        canteenId,
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      };

  return this.find(query)
    .populate('categoryId', 'name')
    .populate('canteenId', 'name')
    .sort({ stock: 1 });
};

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
