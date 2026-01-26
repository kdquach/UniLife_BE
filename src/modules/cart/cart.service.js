import { Cart } from "./cart.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/AppError.js";

export const getCartByUser = async (userId) => {
  let cart = await Cart.findOne({ userId })
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

export const addItem = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (product.status !== "available") {
    throw new AppError("Product is not available", 400);
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      canteenId: product.canteenId,
      items: [{ productId, quantity }],
    });
  } else {
    // Check if product is from same canteen
    if (
      cart.canteenId &&
      cart.canteenId.toString() !== product.canteenId.toString()
    ) {
      throw new AppError(
        "Cannot add products from different canteens. Please clear your cart first.",
        400,
      );
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    if (!cart.canteenId) {
      cart.canteenId = product.canteenId;
    }
  }

  await cart.calculateTotal();
  await cart.save();

  return Cart.findById(cart._id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");
};

export const updateCartById = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (itemIndex === -1) {
    throw new AppError("Item not found in cart", 404);
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  // Reset canteen if cart is empty
  if (cart.items.length === 0) {
    cart.canteenId = null;
  }

  await cart.calculateTotal();
  await cart.save();

  return Cart.findById(cart._id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");
};

export const removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId,
  );

  if (cart.items.length === 0) {
    cart.canteenId = null;
  }

  await cart.calculateTotal();
  await cart.save();

  return Cart.findById(cart._id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");
};

export const getCartTotal = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return { itemCount: 0, totalPrice: 0 };
  }

  await cart.calculateTotal();
  await cart.save();

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return { itemCount, totalPrice: cart.totalPrice };
};

export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];
  cart.canteenId = null;
  cart.totalPrice = 0;
  await cart.save();

  return cart;
};