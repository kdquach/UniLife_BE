import express from "express";
import * as canteenController from "./canteen.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";
import { auditLogger } from "../auditLog/auditLog.middleware.js";

const router = express.Router();

// Public routes
router.get("/", canteenController.getAllCanteens);
router.get("/:id", canteenController.getCanteenById);

// Protected routes
router.use(protect);

router.post(
  "/",
  restrictTo("admin", "manager"),
  auditLogger("CREATE", "Canteen", "Canteen"),
  canteenController.createCanteen,
);

router.patch(
  "/:id/review",
  restrictTo("admin"),
  auditLogger("UPDATE", "Canteen", "Review Canteen Registration"),
  canteenController.reviewCanteenRegistration,
);

router.patch(
  "/:id",
  restrictTo("admin", "manager"),
  auditLogger("UPDATE", "Canteen", "Canteen"),
  canteenController.updateCanteen,
);
router.delete(
  "/:id",
  restrictTo("admin", "manager"),
  auditLogger("DELETE", "Canteen", "Canteen"),
  canteenController.deleteCanteen,
);

export default router;
