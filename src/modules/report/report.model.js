import mongoose from 'mongoose';

// Report Snapshot Schema - for storing periodic report data
const reportSnapshotSchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      required: [true, 'Canteen ID is required'],
    },
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: [true, 'Report type is required'],
    },
    reportName: {
      type: String,
      required: [true, 'Report name is required'],
      trim: true,
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
    },
    data: {
      // Sales data
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },

      // Product data
      topProducts: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          productName: String,
          quantitySold: Number,
          revenue: Number,
        },
      ],

      // Category data
      categorySales: [
        {
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductCategory',
          },
          categoryName: String,
          totalSales: Number,
          revenue: Number,
        },
      ],

      // Customer data
      newCustomers: { type: Number, default: 0 },
      returningCustomers: { type: Number, default: 0 },

      // Staff data
      staffPerformance: [
        {
          staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          staffName: String,
          ordersHandled: Number,
          totalWorkHours: Number,
        },
      ],

      // Feedback data
      totalFeedbacks: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

reportSnapshotSchema.index({ canteenId: 1, reportType: 1, periodStart: 1 });
reportSnapshotSchema.index({ createdAt: -1 });

// Shift Summary Schema - for daily shift reports
const shiftSummarySchema = new mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      required: [true, 'Canteen ID is required'],
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    staffAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    summary: {
      totalOrders: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
      cancelledOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageOrderTime: { type: Number, default: 0 }, // in minutes
      peakHour: { type: String },
      topSellingProducts: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          productName: String,
          quantity: Number,
        },
      ],
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'reviewed'],
      default: 'open',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

shiftSummarySchema.index({ canteenId: 1, date: -1 });
shiftSummarySchema.index({ shiftId: 1, date: 1 }, { unique: true });

// Pickup Log Schema - for tracking order pickups
const pickupLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
    },
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      required: [true, 'Canteen ID is required'],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'qr_generated',
        'qr_scanned',
        'pickup_confirmed',
        'pickup_failed',
        'expired',
      ],
      required: [true, 'Action is required'],
    },
    qrCode: {
      type: String,
    },
    scannedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

pickupLogSchema.index({ orderId: 1, createdAt: -1 });
pickupLogSchema.index({ canteenId: 1, createdAt: -1 });
pickupLogSchema.index({ customerId: 1 });

export const ReportSnapshot = mongoose.model(
  'ReportSnapshot',
  reportSnapshotSchema
);
export const ShiftSummary = mongoose.model('ShiftSummary', shiftSummarySchema);
export const PickupLog = mongoose.model('PickupLog', pickupLogSchema);
