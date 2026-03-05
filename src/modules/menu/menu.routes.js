import express from "express";
import * as menuController from "./menu.controller.js";
import { protect, requirePermission, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ============ Menu Schedule Routes ============
// Must be defined before /:id to avoid conflicts
router.get("/schedules", menuController.getAllMenuSchedules);
router.get("/schedules/:id", menuController.getMenuScheduleById);

// Protected schedule routes
router.post(
  "/schedules",
  protect,
  restrictTo("staff", "manager"),
  menuController.createMenuSchedule,
);
router.post(
  "/schedules/:id/duplicate",
  protect,
  restrictTo("staff", "manager"),
  menuController.duplicateSchedule,
);
router.patch(
  "/schedules/:id",
  protect,
  restrictTo("staff", "manager"),
  menuController.updateMenuSchedule,
);
router.patch(
  "/schedules/:id/toggle",
  protect,
  restrictTo("staff", "manager"),
  menuController.toggleScheduleStatus,
);
router.delete(
  "/schedules/:id",
  protect,
  restrictTo("staff", "manager"),
  menuController.deleteMenuSchedule,
);

// ============ Menu Routes ============
// Public routes
router.get("/", menuController.getAllMenus);
router.get("/canteen/:canteenId/current-menu", menuController.getCurrentMenuByCanteen);
router.get("/:id", menuController.getMenuById);

// Protected routes
router.use(protect);
router.use(restrictTo("staff", "manager"));

router.post("/",
  menuController.createMenu);

router.patch("/:id", menuController.updateMenu);

// Menu items management
router.post("/:id/items", menuController.addMenuItem);
router.delete("/:id/items/:productId", menuController.removeMenuItem);

// Manager only
router.delete("/:id", restrictTo("manager"), menuController.deleteMenu);

export default router;
