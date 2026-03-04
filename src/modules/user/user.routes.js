import express from "express";
import * as userController from "./user.controller.js";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get current user profile
router.get("/me", userController.getMe);

// Allow managers and canteen owners to view users list
router.get(
  "/",
  restrictTo("admin", "canteen_owner", "manager"),
  userController.getAllUsers,
);

// Admin only routes for modify operations
router.use(restrictTo("admin"));

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
