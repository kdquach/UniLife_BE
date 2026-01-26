import mongoose from "mongoose";
import { Cart } from "../modules/cart/cart.model.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Sync indexes to match latest schema (drops stale indexes like userId_1)
    try {
      //Tạo index mới nếu schema có mà DB chưa có
      //Xóa index cũ nếu DB có nhưng schema đã bỏ
      await Cart.syncIndexes();
      console.log("Cart indexes synced");
    } catch (idxErr) {
      console.warn("Cart index sync failed:", idxErr?.message || idxErr);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
