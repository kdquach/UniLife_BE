import express from 'express';
import cors from 'cors';
import getMorganMiddleware from './config/morgan.js';
import {
  requestId,
  requestLogger,
  errorLogger,
} from './middlewares/logging.middleware.js';
import {
  captureOldValues,
  auditLogMiddleware,
  auditErrorLogging,
} from './modules/auditLog/auditLog.middleware.js';

// ============ Import Routes ============
import authRoutes from './modules/auth/auth.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import userRoutes from './modules/user/user.routes.js';
import profileRoutes from './modules/profile/profile.route.js';
import canteenRoutes from './modules/canteen/canteen.routes.js';
import productRoutes from './modules/product/product.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import shiftRoutes from './modules/shift/shift.routes.js';
import salaryRoutes from './modules/salary/salary.routes.js';
import roleRoutes from './modules/role/role.routes.js';
import productCategoryRoutes from './modules/productCategory/productCategory.routes.js';
import ingredientCategoryRoutes from './modules/ingredientCategory/ingredientCategory.routes.js';
import ingredientRoutes from './modules/ingredient/ingredient.routes.js';
import recipeRoutes from './modules/recipe/recipe.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import feedbackReplyRoutes from './modules/feedbackReply/feedbackReply.routes.js';
import voucherRoutes from './modules/voucher/voucher.routes.js';
import bannerRoutes from './modules/banner/banner.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import auditLogRoutes from './modules/auditLog/auditLog.routes.js';

// ============ Import Error Handler ============
import errorHandler from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';

const app = express();

// ============ Middlewares ============

// Enable CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID
app.use(requestId);

// HTTP logging
app.use(getMorganMiddleware(process.env.NODE_ENV));

// File logging
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(requestLogger);
}

// Audit logging middleware
app.use(captureOldValues);
app.use(auditLogMiddleware);

// ============ Routes ============

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'UniLife API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/products', productRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/ingredient-categories', ingredientCategoryRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/feedback-replies', feedbackReplyRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// ============ Error Handling ============

// Error logging
app.use(auditErrorLogging);
app.use(errorLogger);

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandler);

export default app;
