/**
 * Seed Orders Script — Tạo dữ liệu đơn hàng test (Cô lập theo Canteen của Staff)
 *
 * Chạy: node src/scripts/seed-orders.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import User from "../modules/user/user.model.js";
import Canteen from "../modules/canteen/canteen.model.js";
import Product from "../modules/product/product.model.js";
import Order from "../modules/order/order.model.js";
import connectDB from "../config/db.js";

const seedOrders = async () => {
  try {
    await connectDB();
    console.log("\n🛒 Starting order seeding...\n");

    // 1. Tìm staff account đang test
    const staffEmail = "staff1@unilife.com";
    const staffUser = await User.findOne({ email: staffEmail });
    if (!staffUser)
      throw new Error(
        `Không tìm thấy ${staffEmail}. Hãy chạy assign-staff script trước.`,
      );

    // 2. Tìm Canteen của staff
    const canteen = await Canteen.findById(staffUser.canteenId);
    if (!canteen)
      throw new Error(`${staffEmail} chưa được gán canteen hợp lệ.`);

    // 3. Tìm Khách hàng
    const customers = await User.find({
      role: "customer",
      status: "active",
    }).limit(3);

    // 4. Tìm Sản phẩm của đúng Canteen này
    const products = await Product.find({
      canteenId: canteen._id,
      status: "available",
    }).limit(6);
    if (products.length === 0)
      throw new Error(`Canteen ${canteen.name} không có sản phẩm nào!`);

    console.log(`🎯 Đang seed dữ liệu cho:`);
    console.log(`   Staff: ${staffUser.fullName} (${staffUser.email})`);
    console.log(`   Canteen: ${canteen.name}`);
    console.log(`   Products: ${products.map((p) => p.name).join(", ")}\n`);

    // ============ Xóa đơn cũ (để test lại từ đầu) ============
    const deletedCount = await Order.deleteMany({
      canteenId: canteen._id,
      note: { $regex: /^\[SEED\]/ },
    });
    console.log(
      `🗑️  Đã xóa ${deletedCount.deletedCount} đơn seed cũ của canteen này\n`,
    );

    // ============ Helper tạo items ============
    const makeItems = (productIndexes, quantities) => {
      return productIndexes.map((idx, i) => {
        const p = products[idx % products.length];
        return {
          productId: p._id,
          productName: p.name,
          quantity: quantities[i] || 1,
          price: p.price,
        };
      });
    };

    const calcTotal = (items) =>
      items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // ============ Tạo đơn hàng ============
    const now = new Date();
    const ordersToCreate = [];

    // --- 1. Lên kịch bản HẾT HẠN TRONG VÒNG VÀI PHÚT ---
    // Cập nhật Canteen closing time thành 5 phút nữa, để staff kịp check và sau đó thấy cron chạy!
    const closingTimeObj = new Date(now.getTime() - 14 * 60000); // 14 mins ago closing time?
    // Wait, the cron triggers when current time >= closing+15.
    // To trigger it in ~1 minute, we set closingTime to exactly 14 minutes ago.
    const closeH = String(closingTimeObj.getHours()).padStart(2, "0");
    const closeM = String(closingTimeObj.getMinutes()).padStart(2, "0");
    canteen.closingTime = `${closeH}:${closeM}`;
    await canteen.save();
    console.log(
      `⏰ Đã chỉnh giờ đóng cửa của canteen thành: ${canteen.closingTime}`,
    );
    console.log(
      `   => Đơn 'ready' sẽ TỰ ĐỘNG HỦY TRONG VÒNG 1-2 PHÚT NỮA để em test realtime nhé!\n`,
    );

    // --- 2. Tạo đơn ---
    ordersToCreate.push({
      userId: customers[0]._id,
      canteenId: canteen._id,
      status: "pending",
      items: makeItems([0], [1]),
      payment: { method: "cash", status: "pending" },
      note: "[SEED] Đơn pending #1 - Chờ staff xác nhận",
    });

    ordersToCreate.push({
      userId: customers[1]._id,
      canteenId: canteen._id,
      status: "confirmed",
      staffId: staffUser._id,
      items: makeItems([1], [2]),
      payment: { method: "momo", status: "completed", paidAt: now },
      note: "[SEED] Đơn confirmed #1 - Mới xác nhận",
    });

    ordersToCreate.push({
      userId: customers[2 % customers.length]._id,
      canteenId: canteen._id,
      status: "preparing",
      staffId: staffUser._id,
      items: makeItems([0, 1], [1, 1]),
      payment: { method: "balance", status: "completed", paidAt: now },
      note: "[SEED] Đơn preparing #1 - Đang nấu",
    });

    // 5 ĐƠN READY
    for (let i = 0; i < 5; i++) {
      ordersToCreate.push({
        userId: customers[i % customers.length]._id,
        canteenId: canteen._id,
        status: "ready",
        staffId: staffUser._id,
        items: makeItems([i, (i + 1) % products.length], [1, 2]),
        payment: {
          method: "momo",
          status: "completed",
          paidAt: new Date(now - 15 * 60000),
        },
        preparedAt: new Date(now - 5 * 60000),
        note: `[SEED] ✅ Đơn READY #${i + 1} - Sẵn sàng quét QR (Sẽ bay màu khi canteen đóng cửa)`,
      });
    }

    // ĐƠN ĐÃ XONG / ĐÃ HỦY
    ordersToCreate.push({
      userId: customers[0]._id,
      canteenId: canteen._id,
      status: "completed",
      staffId: staffUser._id,
      items: makeItems([0], [1]),
      payment: {
        method: "momo",
        status: "completed",
        paidAt: new Date(now - 2 * 3600000),
      },
      preparedAt: new Date(now - 1.5 * 3600000),
      completedAt: new Date(now - 1 * 3600000),
      note: "[SEED] Đơn COMPLETED #1 - Lịch sử",
    });

    ordersToCreate.push({
      userId: customers[1]._id,
      canteenId: canteen._id,
      status: "cancelled",
      items: makeItems([1], [1]),
      payment: { method: "cash", status: "pending" },
      cancelledAt: new Date(now - 30 * 60000),
      cancelReason: "Khách hủy",
      note: "[SEED] Đơn CANCELLED #1 - Lịch sử",
    });

    // ============ Insert ============
    let createdOrders = 0;
    for (const orderData of ordersToCreate) {
      orderData.subTotal = calcTotal(orderData.items);
      orderData.totalAmount = orderData.subTotal;
      orderData.discount = 0;

      try {
        const order = await Order.create(orderData);
        createdOrders++;
        console.log(
          `   ${order.status.padEnd(9)} | ${order.orderNumber} | ${orderData.note}`,
        );
      } catch (err) {
        console.error(`   ❌ Lỗi tạo đơn: ${err.message}`);
      }
    }

    console.log(
      `\n✅ Đã tạo ${createdOrders}/${ordersToCreate.length} đơn hàng. Bạn có thể check FE ngay.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
};

seedOrders();
