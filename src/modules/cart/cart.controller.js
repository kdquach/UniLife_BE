import catchAsync from "../../utils/catchAsync.js";
import * as cartService from "./cart.service.js";

export const getItems = catchAsync(async (req, res) => {
  const { canteenId } = req.query;

  const cart = await cartService.getCartByUser(req.user._id, canteenId);
  res.status(200).json({ status: "success", data: { cart } });
});

export const addItem = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(req.user._id, productId, quantity);
  res.status(200).json({ status: "success", data: { cart } });
});

export const updateCartById = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const { canteenId } = req.query;
  const cart = await cartService.updateCartById(
    req.user._id,
    canteenId,
    req.params.productId,
    quantity
  );
  res.status(200).json({ status: "success", data: { cart } });
});

export const removeItem = catchAsync(async (req, res) => {
  const { canteenId } = req.query;
  const cart = await cartService.removeItem(
    req.user._id,
    canteenId,
    req.params.productId
  );
  res.status(200).json({ status: "success", data: { cart } });
});


export const getCartTotal = catchAsync(async (req, res) => {
  const { canteenId } = req.query;
  const total = await cartService.getCartTotal(req.user._id, canteenId);
  res.status(200).json({ status: "success", data: total });
});

export const clearCart = catchAsync(async (req, res) => {
  const { canteenId } = req.query;
  const cart = await cartService.clearCart(req.user._id, canteenId);
  res.status(200).json({ status: "success", data: cart });
})