import { Cart } from "./cart.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/AppError.js";
import {
  getRecipeInventoryDetails,
  calculateMaxServingsFromRecipeDetails,
} from "../product/inventory/product.inventory.util.js";

const normalizeQuantity = (value, fieldName = "quantity") => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} is invalid`, 400);
  }

  return parsed;
};

const getMaxOrderableQuantity = async (product) => {
  const hasRecipe = Array.isArray(product.recipe) && product.recipe.length > 0;

  if (hasRecipe) {
    const details = await getRecipeInventoryDetails(product.recipe);
    return calculateMaxServingsFromRecipeDetails(details);
  }

  return Number(product.stockQuantity || 0);
};

export const getCartByUser = async (userId, canteenId) => {
  // 1. Nếu chưa chọn canteen → trả giỏ rỗng
  if (!canteenId) {
    return {
      userId,
      canteenId: null,
      items: [],
    };
  }

  // 2. Có canteenId → tìm cart theo user + canteen
  let cart = await Cart.findOne({ userId, canteenId })
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");

  // 3. Nếu chưa có cart → tạo mới cho canteen đó
  if (!cart) {
    cart = await Cart.create({
      userId,
      canteenId,
      items: [],
    });
  }

  return cart;
};

export const addItem = async (userId, productId, quantity = 1) => {
  const requestedQuantity = normalizeQuantity(quantity);
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.status !== "available")
    throw new AppError("Product is not available", 400);

  const canteenId = product.canteenId;

  let cart = await Cart.findOne({ userId, canteenId });

  const currentQuantityInCart = cart
    ? cart.items.find((i) => i.productId.toString() === productId)?.quantity || 0
    : 0;
  const desiredQuantity = currentQuantityInCart + requestedQuantity;
  const maxOrderable = await getMaxOrderableQuantity(product);
  if (desiredQuantity > maxOrderable) {
    throw new AppError(
      `Số lượng vượt quá tồn kho. Tối đa có thể chọn: ${maxOrderable}`,
      400,
    );
  }

  if (!cart) {
    cart = await Cart.create({
      userId,
      canteenId,
      items: [{ productId, quantity: requestedQuantity }],
    });
  } else {
    const item = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (item) {
      item.quantity += requestedQuantity;
    } else {
      cart.items.push({ productId, quantity: requestedQuantity });
    }
  }

  await cart.calculateTotal();
  await cart.save();

  return Cart.findById(cart._id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");
};


export const updateCartById = async (
  userId,
  canteenId,
  productId,
  quantity
) => {
  const cart = await Cart.findOne({ userId, canteenId });
  if (!cart) throw new AppError("Cart not found", 404);

  const item = cart.items.find(
    (i) => i.productId.toString() === productId
  );

  if (!item) throw new AppError("Item not found in cart", 404);

  const nextQuantity = Number.parseInt(quantity, 10);
  if (Number.isNaN(nextQuantity)) {
    throw new AppError("quantity is invalid", 400);
  }

  if (nextQuantity <= 0) {
    cart.items = cart.items.filter(
      (i) => i.productId.toString() !== productId
    );
  } else {
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.status !== "available")
      throw new AppError("Product is not available", 400);

    const maxOrderable = await getMaxOrderableQuantity(product);
    if (nextQuantity > maxOrderable) {
      throw new AppError(
        `Số lượng vượt quá tồn kho. Tối đa có thể chọn: ${maxOrderable}`,
        400,
      );
    }

    item.quantity = nextQuantity;
  }

  await cart.calculateTotal();
  await cart.save();

  return Cart.findById(cart._id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");
};
export const removeItem = async (userId, canteenId, productId) => {
  const cart = await Cart.findOne({ userId, canteenId });
  if (!cart) throw new AppError("Cart not found", 404);

  cart.items = cart.items.filter(
    (i) => i.productId.toString() !== productId
  );

  await cart.calculateTotal();
  await cart.save();

  return Cart.findById(cart._id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image status");
};


export const getCartTotal = async (userId, canteenId) => {
  // 1. Chưa chọn canteen → giỏ rỗng
  if (!canteenId) {
    return { itemCount: 0, totalPrice: 0 };
  }

  // 2. Lấy cart theo user + canteen
  const cart = await Cart.findOne({ userId, canteenId });

  if (!cart) {
    return { itemCount: 0, totalPrice: 0 };
  }

  // 3. Tính lại total (phòng khi giá đổi)
  await cart.calculateTotal();
  await cart.save();

  const itemCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    itemCount,
    totalPrice: cart.totalPrice,
  };
};


export const clearCart = async (userId, canteenId) => {
  const cart = await Cart.findOne({ userId, canteenId });
  if (!cart) throw new AppError("Cart not found", 404);

  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  return cart;
};
