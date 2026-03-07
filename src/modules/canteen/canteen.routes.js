import express from "express";
import * as canteenController from "./canteen.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", canteenController.getAllCanteens);
router.get("/:id", canteenController.getCanteenById);

// Protected routes
router.use(protect);
// Admin-only management routes
router.use(restrictTo("admin", "manager"));

router.post("/", canteenController.createCanteen);
router.patch("/:id", canteenController.updateCanteen);
router.delete("/:id", canteenController.deleteCanteen);

export default router;
