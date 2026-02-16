import express from "express";
import * as menuController from "./menu.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ============ Menu Schedule Routes ============
// Must be defined before /:id to avoid conflicts
router.get("/schedules", menuController.getAllMenuSchedules);
router.get("/schedules/:id", menuController.getMenuScheduleById);

// Protected schedule routes
router.post(
  "/schedules",
  protect,
  restrictTo("staff", "admin"),
  menuController.createMenuSchedule,
);
router.post(
  "/schedules/:id/duplicate",
  protect,
  restrictTo("staff", "admin"),
  menuController.duplicateSchedule,
);
router.patch(
  "/schedules/:id",
  protect,
  restrictTo("staff", "admin"),
  menuController.updateMenuSchedule,
);
router.patch(
  "/schedules/:id/toggle",
  protect,
  restrictTo("staff", "admin"),
  menuController.toggleScheduleStatus,
);
router.delete(
  "/schedules/:id",
  protect,
  restrictTo("admin"),
  menuController.deleteMenuSchedule,
);

// ============ Menu Routes ============
// Public routes
router.get("/", menuController.getAllMenus);
router.get("/canteen/:canteenId/current-menu", menuController.getCurrentMenuByCanteen);
router.get("/:id", menuController.getMenuById);

// Protected routes
router.use(protect);
router.use(restrictTo("staff", "admin"));

router.post("/", menuController.createMenu);
router.patch("/:id", menuController.updateMenu);

// Menu items management
router.post("/:id/items", menuController.addMenuItem);
router.delete("/:id/items/:productId", menuController.removeMenuItem);

// Admin only
router.delete("/:id", restrictTo("admin"), menuController.deleteMenu);

export default router;
