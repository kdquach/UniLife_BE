import catchAsync from "../../utils/catchAsync.js";
import * as cartService from "./cart.service.js";

export const getMyCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUser(req.user._id);
  res.status(200).json({ status: "success", data: { cart } });
});

export const addToCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addToCart(req.user._id, productId, quantity);
  res.status(200).json({ status: "success", data: { cart } });
});

export const updateCartItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(
    req.user._id,
    req.params.productId,
    quantity,
  );
  res.status(200).json({ status: "success", data: { cart } });
});

export const removeFromCart = catchAsync(async (req, res) => {
  const cart = await cartService.removeFromCart(
    req.user._id,
    req.params.productId,
  );
  res.status(200).json({ status: "success", data: { cart } });
});

export const clearCart = catchAsync(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  res.status(200).json({ status: "success", data: { cart } });
});

export const getCartTotal = catchAsync(async (req, res) => {
  const total = await cartService.getCartTotal(req.user._id);
  res.status(200).json({ status: "success", data: total });
});
