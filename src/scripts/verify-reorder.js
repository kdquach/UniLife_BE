import mongoose from "mongoose";
import dotenv from "dotenv";
import { checkMenuAvailability } from "../modules/menu/menu.service.js";
import { reOrderToCart } from "../modules/order/order.service.js";
import User from "../modules/user/user.model.js";
import Order from "../modules/order/order.model.js";
import Canteen from "../modules/canteen/canteen.model.js";
import Product from "../modules/product/product.model.js";
import Campus from "../modules/campus/campus.model.js";
import { Cart } from "../modules/cart/cart.model.js";
// Try to import ProductCategory, if fails, use generic model
let ProductCategory;
try {
  const module =
    await import("../modules/productCategory/productCategory.model.js");
  ProductCategory = module.default;
} catch (e) {
  // If path is different (e.g. category/category.model.js) we might fail,
  // but find_by_name usually helps. We'll fallback or assume we find it.
}

dotenv.config();

const run = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/unilife",
    );
    console.log("Connected to DB");

    // Create Mock Data
    console.log("--- Creating Mock Data ---");

    // 1. Campus
    let campus = await Campus.findOne({ code: "TEST_REORDER" });
    if (!campus) {
      campus = await Campus.create({
        name: "Test Campus Reorder",
        code: "TEST_REORDER",
        address: "123 Test St",
      });
    }
    console.log("Campus:", campus._id);

    // 2. User
    let user = await User.findOne({ email: "test_reorder@example.com" });
    if (!user) {
      user = await User.create({
        fullName: "Test User",
        email: "test_reorder@example.com",
        password: "password123",
        role: "customer",
        phone: "0123456789",
      });
    }
    console.log("User:", user._id);

    // 3. Canteen
    let canteen = await Canteen.findOne({ name: "Test Canteen Reorder" });
    if (!canteen) {
      canteen = await Canteen.create({
        name: "Test Canteen Reorder",
        location: "Test Location",
        image: "test.jpg",
        campusId: campus._id,
      });
    }

    // 3.5 Product Category
    if (!ProductCategory) {
      // Try to find it if dynamic import failed
      ProductCategory = mongoose.model("ProductCategory");
      if (!ProductCategory) {
        // Define minimal if needed or crash
        const schema = new mongoose.Schema({ name: String, type: String });
        ProductCategory = mongoose.model("ProductCategory", schema);
      }
    }

    let category = await ProductCategory.findOne({ name: "Test Category" });
    if (!category) {
      category = await ProductCategory.create({
        name: "Test Category",
        type: "food", // Valid types usually food/drink
      });
    }
    console.log("Category:", category._id);

    // 4. Product
    let product = await Product.findOne({
      name: "Test Product Reorder",
      canteenId: canteen._id,
    });
    if (!product) {
      product = await Product.create({
        name: "Test Product Reorder",
        canteenId: canteen._id,
        price: 15000,
        status: "available",
        image: "product.jpg",
        stock: 100,
        categoryId: category._id,
      });
    } else {
      product.stock = 100;
      await product.save();
    }
    console.log("Product:", product._id);

    // 5. Create Menu for Today
    const Menu = mongoose.model("Menu");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    await Menu.deleteMany({
      canteenId: canteen._id,
      date: { $gte: startOfDay },
    });

    const menu = await Menu.create({
      canteenId: canteen._id,
      date: new Date(),
      status: "active",
      items: [{ productId: product._id, price: 15000 }],
    });
    console.log("Menu created for today:", menu._id);

    console.log("--- Testing checkMenuAvailability ---");
    // Test checkMenuAvailability
    const isAvailable = await checkMenuAvailability(product._id, canteen._id);
    console.log(`Product "${product.name}" available today?`, isAvailable);

    console.log("--- Testing reOrderToCart ---");

    await Cart.deleteOne({ userId: user._id });

    const order = await Order.create({
      userId: user._id,
      canteenId: canteen._id,
      items: [
        {
          productId: product._id,
          productName: product.name,
          quantity: 2,
          price: 15000,
        },
      ],
      subTotal: 30000,
      totalAmount: 30000,
      status: "completed",
      payment: { method: "cash", status: "completed" },
    });
    console.log("Created Old Order:", order._id);

    try {
      // Try to re-order
      const result = await reOrderToCart(user._id, order._id, canteen._id);
      console.log("Re-order result:", JSON.stringify(result, null, 2));

      if (
        result &&
        result.successItems &&
        result.successItems.includes(product.name)
      ) {
        console.log("SUCCESS: Re-order verified!");
      } else {
        console.log("FAILURE: Re-order result unexpected.");
      }
    } catch (err) {
      console.log("Re-order FAILED with error:", err);
    }

    // Cleanup
    await Order.findByIdAndDelete(order._id);
    await Menu.findByIdAndDelete(menu._id);
    await Product.findByIdAndDelete(product._id);
    await Canteen.findByIdAndDelete(canteen._id);
    await User.findByIdAndDelete(user._id);
    await Campus.findByIdAndDelete(campus._id);
    await ProductCategory.findByIdAndDelete(category._id);
    await Cart.deleteOne({ userId: user._id });
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
};

run();
