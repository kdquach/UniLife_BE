import mongoose from 'mongoose';

// Embedded recipe ingredient schema
const recipeIngredientSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'Ingredient ID is required'],
    },
    ingredientName: {
      type: String,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      required: [true, 'Canteen ID is required'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Category ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'out_of_stock', 'hidden'],
      default: 'available',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    image: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    // Nutritional info
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative'],
    },
    preparationTime: {
      type: Number, // in minutes
      min: [0, 'Preparation time cannot be negative'],
    },
    // Flags
    isPopular: {
      type: Boolean,
      default: false,
    },
    isNew: {
      type: Boolean,
      default: true,
    },
    // Stock management
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    // Sales stats
    totalSold: {
      type: Number,
      default: 0,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    // Embedded recipe (array of ingredients)
    recipe: [recipeIngredientSchema],
    // Display order
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Xoa mem
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
productSchema.index({ canteenId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ isPopular: 1, totalSold: -1 });
productSchema.index({ isDeleted: 1 });

// Generate slug from name
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

productSchema.pre(/^find/, function (next) {
  const options = this.getOptions ? this.getOptions() : {};

  if (options?.includeDeleted) {
    return next();
  }

  this.where({ isDeleted: { $ne: true } });
  return next();
});

productSchema.pre('countDocuments', function (next) {
  const options = this.getOptions ? this.getOptions() : {};

  if (options?.includeDeleted) {
    return next();
  }

  this.where({ isDeleted: { $ne: true } });
  return next();
});

// Check low stock
productSchema.methods.isLowStock = function () {
  return this.stockQuantity <= this.lowStockThreshold;
};

const Product = mongoose.model('Product', productSchema);

export default Product;
