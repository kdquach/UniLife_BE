import express from "express";
import * as cartController from "./cart.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", cartController.getMyCart);
router.get("/total", cartController.getCartTotal);
router.post("/add", cartController.addToCart);
router.patch("/items/:productId", cartController.updateCartItem);
router.delete("/items/:productId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);

export default router;
