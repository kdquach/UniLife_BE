import mongoose from 'mongoose';

// Danh sach don vi hop le cho nguyen lieu
const VALID_UNITS = ['kg', 'g', 'lít', 'ml', 'cái', 'gói', 'hộp', 'lon'];

const normalizeUnitValue = (unit) => unit;

const getDefaultStandardConfig = (unit) => {
  const normalizedUnit = normalizeUnitValue(unit);

  switch (normalizedUnit) {
    case 'kg':
      return { standardUnit: 'g', standardUnitFactor: 1000 };
    case 'g':
      return { standardUnit: 'g', standardUnitFactor: 1 };
    case 'lít':
      return { standardUnit: 'ml', standardUnitFactor: 1000 };
    case 'ml':
      return { standardUnit: 'ml', standardUnitFactor: 1 };
    default:
      return { standardUnit: normalizedUnit, standardUnitFactor: 1 };
  }
};

const normalizeCostFields = (target) => {
  if (!target || typeof target !== 'object') {
    return;
  }

  const hasCostRelatedField = [
    'unit',
    'standardUnit',
    'standardUnitFactor',
    'costPrice',
    'costPerStandardUnit',
  ].some((field) => target[field] !== undefined);

  if (!hasCostRelatedField) {
    return;
  }

  if (target.unit) {
    target.unit = normalizeUnitValue(target.unit);
  }

  const baseUnit = target.unit || target.standardUnit;
  const defaultConfig = getDefaultStandardConfig(baseUnit);

  target.standardUnit = normalizeUnitValue(
    target.standardUnit || defaultConfig.standardUnit
  );

  const standardUnitFactor = Number(target.standardUnitFactor);
  target.standardUnitFactor =
    Number.isFinite(standardUnitFactor) && standardUnitFactor > 0
      ? standardUnitFactor
      : defaultConfig.standardUnitFactor;

  const costPrice = Number(target.costPrice);
  const costPerStandardUnit = Number(target.costPerStandardUnit);

  if (
    Number.isFinite(costPrice) &&
    costPrice > 0 &&
    (!Number.isFinite(costPerStandardUnit) || costPerStandardUnit <= 0)
  ) {
    target.costPerStandardUnit = costPrice / target.standardUnitFactor;
    return;
  }

  if (
    Number.isFinite(costPerStandardUnit) &&
    costPerStandardUnit > 0 &&
    (!Number.isFinite(costPrice) || costPrice <= 0)
  ) {
    target.costPrice = costPerStandardUnit * target.standardUnitFactor;
  }
};

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
    // Gia von theo don vi nhap kho (VD: 1kg, 1 lít)
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Giá vốn không được âm'],
    },
    // Don vi chuan de quy doi chi phi (VD: g, ml)
    standardUnit: {
      type: String,
      trim: true,
      enum: {
        values: VALID_UNITS,
        message: `Đơn vị chuẩn phải là một trong: ${VALID_UNITS.join(', ')}`,
      },
    },
    // He so quy doi: 1 don vi nhap = bao nhieu don vi chuan
    standardUnitFactor: {
      type: Number,
      default: 1,
      min: [0.000001, 'Hệ số quy đổi phải lớn hơn 0'],
    },
    // Chi phi tren 1 don vi chuan
    costPerStandardUnit: {
      type: Number,
      default: 0,
      min: [0, 'Chi phí/đơn vị chuẩn không được âm'],
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
ingredientSchema.index({ stock: 1 }); // Index cho truy van low stock
ingredientSchema.index({ canteenId: 1, stock: 1 }); // Compound index cho filter canteen + stock
ingredientSchema.index({ canteenId: 1, isActive: 1 }); // Filter active ingredients
ingredientSchema.index({ isActive: 1 });

// Pre-save middleware: Chuan hoa don vi va chi phi don vi chuan
ingredientSchema.pre('save', function (next) {
  normalizeCostFields(this);
  next();
});

// Pre-update middleware: Chuan hoa don vi va chi phi don vi chuan
ingredientSchema.pre('findOneAndUpdate', function (next) {
  if (this._update) {
    if (this._update.$set) {
      normalizeCostFields(this._update.$set);
    } else {
      normalizeCostFields(this._update);
    }
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
