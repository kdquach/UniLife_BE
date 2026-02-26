// test-cron-cancel.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import { autoCancelExpiredOrders } from "./src/modules/order/order.service.js";
import User from "./src/modules/user/user.model.js";
import Canteen from "./src/modules/canteen/canteen.model.js";
import Order from "./src/modules/order/order.model.js";

const runTest = async () => {
  let tempOrderId = null;
  let originalClosingTime = null;
  let canteenId = null;

  try {
    console.log("=== BẮT ĐẦU TEST CHỨC NĂNG HỦY ĐƠN HÀNG QUÁ HẠN ===");

    // Kết nối Database
    await connectDB();
    console.log("✅ Đã kết nối Database thành công.");

    // 1. Tìm Staff
    const staffEmail = "staff1@unilife.com";
    const staff = await User.findOne({ email: staffEmail });

    if (!staff) {
      throw new Error(`Không tìm thấy staff với email ${staffEmail}`);
    }

    if (!staff.canteenId) {
      throw new Error(`Staff ${staffEmail} chưa được gán canteenId`);
    }

    // 2. Lấy Canteen của Staff này
    const canteen = await Canteen.findById(staff.canteenId);
    if (!canteen) {
      throw new Error(`Không tìm thấy Canteen có ID: ${staff.canteenId}`);
    }

    canteenId = canteen._id;
    originalClosingTime = canteen.closingTime || "22:00";

    // 3. Chỉnh sửa giờ đóng cửa của Canteen về 20 phút trước để trigger điều kiện "quá hạn"
    // (Giả sử hiện tại là 13:20 -> Đặt giờ đóng cửa là 13:00 -> +15 phút là 13:15 -> 13:20 đã là quá 13:15)
    console.log(
      `\nCanteen hiện tại: ${canteen.name} (Giờ đóng cửa gốc: ${originalClosingTime})`,
    );

    const now = new Date();
    const pastTime = new Date(now.getTime() - 20 * 60000); // lùi về 20 phút trước
    const mockHH = String(pastTime.getHours()).padStart(2, "0");
    const mockMM = String(pastTime.getMinutes()).padStart(2, "0");

    canteen.closingTime = `${mockHH}:${mockMM}`;
    await canteen.save();
    console.log(
      `⚙️ Đã set tạm thời giờ đóng cửa Canteen thành ${canteen.closingTime} để test`,
    );

    // 4. Tạo một Order với trạng thái 'ready'
    const newOrder = await Order.create({
      userId: staff._id, // tạm mượn ID staff làm người đặt luôn cũng được, hoặc bất kì ai
      canteenId: canteen._id,
      status: "ready",
      // Các field bắt buộc
      subTotal: 0,
      totalAmount: 0,
      payment: { method: "cash", status: "pending" },
      items: [],
      note: "Đơn hàng test cron job tự hủy",
    });

    tempOrderId = newOrder._id;
    console.log(
      `📦 Đã tạo đơn hàng test (ID: ${tempOrderId}) với trạng thái 'ready'`,
    );

    // 5. Chạy hàm autoCancelExpiredOrders
    console.log("\n⏳ Đang chạy hàm quét và hủy đơn bị quá hạn...");
    const result = await autoCancelExpiredOrders();

    // In kết quả
    console.log("\n==================================");
    console.log("📊 KẾT QUẢ TEST:");
    console.log("==================================");
    console.log(`- Số lượng đơn hàng đã tự động hủy: ${result.totalCancelled}`);
    console.log(
      `- Thời gian xử lý: ${result.timestamp.toLocaleString("vi-VN")}`,
    );

    // 6. Kiểm tra lại đơn hàng vừa tạo xem đã bị hủy chưa
    const checkOrder = await Order.findById(tempOrderId);
    if (checkOrder && checkOrder.status === "cancelled") {
      console.log(
        `✅ THÀNH CÔNG: Đơn hàng test (ID: ${tempOrderId}) đã bị chuyển sang trạng thái '${checkOrder.status}'`,
      );
      console.log(`   Lý do hủy: ${checkOrder.cancelReason}`);
    } else {
      console.log(
        `❌ THẤT BẠI: Đơn hàng test (ID: ${tempOrderId}) có trạng thái '${checkOrder?.status}', đáng lý phải là 'cancelled'`,
      );
    }
    console.log("==================================\n");
  } catch (error) {
    console.error("❌ Test thất bại với lỗi:", error);
  } finally {
    // 7. Khôi phục lại trạng thái dữ liệu (QUAN TRỌNG)
    console.log("🧹 Đang dọn dẹp và khôi phục dữ liệu...");
    if (canteenId && originalClosingTime) {
      await Canteen.findByIdAndUpdate(canteenId, {
        closingTime: originalClosingTime,
      });
      console.log(
        `- Đã khôi phục giờ đóng cửa Canteen về ${originalClosingTime}`,
      );
    }

    // (Tuỳ chọn) Nếu muốn xóa luôn đơn vừa tạo để rác DB
    // if (tempOrderId) {
    //    await Order.findByIdAndDelete(tempOrderId);
    //    console.log("- Đã xóa đơn hàng test khỏi Database");
    // }

    // Đóng kết nối DB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Đã đóng kết nối Database.");
    }
    process.exit(0);
  }
};

// Chạy test
runTest();
