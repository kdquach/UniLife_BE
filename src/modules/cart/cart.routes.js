import express from "express";
import * as cartController from "./cart.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", cartController.getItems);
router.get("/total", cartController.getCartTotal);
router.post("/add", cartController.addItem);
router.patch("/items/:productId", cartController.updateCartById);
router.delete("/items/:productId", cartController.removeItem);
router.delete("/clear", cartController.clearCart);

export default router;
