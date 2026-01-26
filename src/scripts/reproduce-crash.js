import mongoose from "mongoose";
import dotenv from "dotenv";
import { reOrderToCart } from "../modules/order/order.service.js";
import User from "../modules/user/user.model.js";
import Order from "../modules/order/order.model.js";
import Canteen from "../modules/canteen/canteen.model.js";
import Campus from "../modules/campus/campus.model.js";
import { Cart } from "../modules/cart/cart.model.js";

dotenv.config();

const run = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/unilife",
    );
    console.log("Connected to DB");

    console.log("--- Setting up Crash Scenario ---");

    // 1. Campus
    let campus = await Campus.findOne({ code: "CRASH_TEST" });
    if (!campus) {
      campus = await Campus.create({
        name: "Crash Campus",
        code: "CRASH_TEST",
        address: "Crash Loop Way",
      });
    }

    // 2. Canteen
    let canteen = await Canteen.findOne({ name: "Crash Canteen" });
    if (!canteen) {
      canteen = await Canteen.create({
        name: "Crash Canteen",
        location: "Null Island",
        image: "null.jpg",
        campusId: campus._id,
      });
    }

    // 3. User
    let user = await User.findOne({ email: "crash_test@example.com" });
    if (!user) {
      user = await User.create({
        fullName: "Crash Test",
        email: "crash_test@example.com",
        password: "password",
        role: "customer",
        phone: "0000000000",
      });
    }

    // 4. Create Cart with NULL canteenId (The Trigger)
    await Cart.deleteOne({ userId: user._id });
    const cart = await Cart.create({
      userId: user._id,
      canteenId: null, // <--- CRITICAL: This causes the crash when accessing .toString()
      items: [],
    });
    console.log("Created corrupted cart:", cart._id);

    // 5. Create Mock Old Order (so reOrderToCart passes initial checks)
    const order = await Order.create({
      userId: user._id,
      canteenId: canteen._id,
      items: [],
      totalAmount: 0,
      subTotal: 0,
      status: "completed",
      payment: { method: "cash", status: "completed" },
    });

    console.log(
      `Calling reOrderToCart(user=${user._id}, order=${order._id}, canteen=${canteen._id})...`,
    );
    try {
      await reOrderToCart(user._id, order._id, canteen._id);
      console.log("SUCCESS: Did not crash (Unexpected if bug exists)");
    } catch (err) {
      console.log("Caught Error:", err.name, err.message);
      if (err.name === "TypeError" && err.message.includes("toString")) {
        console.log("✅ VERIFIED: Reproduced the specific crash!");
      } else {
        console.log("❓ DIFFERENT ERROR:", err);
        console.log(err);
      }
    }

    // Cleanup
    await Cart.deleteOne({ userId: user._id });
    await Order.deleteOne({ _id: order._id });
    await Canteen.deleteOne({ _id: canteen._id });
    await Campus.deleteOne({ _id: campus._id });
    await User.deleteOne({ _id: user._id });
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
