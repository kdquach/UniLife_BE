import express from "express";
import cors from "cors";
import morgan from "morgan";

// Import routes
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import canteenRoutes from "./modules/canteen/canteen.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import menuRoutes from "./modules/menu/menu.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import shiftRoutes from "./modules/shift/shift.routes.js";
import salaryRoutes from "./modules/salary/salary.routes.js";
import roleRoutes from "./modules/role/role.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import ingredientRoutes from "./modules/ingredient/ingredient.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import feedbackRoutes from "./modules/feedback/feedback.routes.js";
import voucherRoutes from "./modules/voucher/voucher.routes.js";
import bannerRoutes from "./modules/banner/banner.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";

// Import error handler
import errorHandler from "./middlewares/error.middleware.js";
import AppError from "./utils/AppError.js";

const app = express();

// ============ Middlewares ============

// Enable CORS
app.use(cors());

// Body parser - increased limit for image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ============ Routes ============

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "UniLife API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/products", productRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);

// ============ Error Handling ============

// Handle 404 - Route not found
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandler);

export default app;
