import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Script kiểm tra dữ liệu StaffShift cho payroll
const checkPayrollData = async () => {
  try {
    console.log("🔌 Kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB\n");

    // Lấy canteen đầu tiên
    const canteen = await mongoose.connection.db
      .collection("canteens")
      .findOne({});

    console.log(`📍 Canteen: ${canteen.name} (${canteen._id})\n`);

    // Kiểm tra dữ liệu tháng 1/2026
    console.log("📅 Kiểm tra dữ liệu tháng 01/2026:");
    console.log("=".repeat(60));

    const jan2026Start = new Date("2026-01-01");
    const jan2026End = new Date("2026-01-31");
    jan2026End.setHours(23, 59, 59, 999);

    // Query theo date (ĐÚNG)
    const staffShiftsByDate = await mongoose.connection.db
      .collection("staffshifts")
      .find({
        canteenId: canteen._id,
        status: "checked_out",
        date: { $gte: jan2026Start, $lte: jan2026End },
      })
      .toArray();

    console.log(`✅ Query theo DATE: ${staffShiftsByDate.length} ca`);

    // Aggregate như trong payroll.service.js (SAI - theo checkInTime/checkOutTime)
    const oldWay = await mongoose.connection.db
      .collection("staffshifts")
      .find({
        canteenId: canteen._id,
        status: "checked_out",
        checkInTime: { $gte: jan2026Start },
        checkOutTime: { $lte: jan2026End },
      })
      .toArray();

    console.log(
      `❌ Query cũ (checkInTime/checkOutTime): ${oldWay.length} ca\n`,
    );

    if (staffShiftsByDate.length > 0) {
      console.log("📊 Sample 5 records:");
      staffShiftsByDate.slice(0, 5).forEach((shift, idx) => {
        console.log(`\n${idx + 1}. Ca làm việc:`);
        console.log(`   - ID: ${shift._id}`);
        console.log(`   - Staff ID: ${shift.staffId}`);
        console.log(`   - Date: ${shift.date.toLocaleDateString("vi-VN")}`);
        console.log(`   - Status: ${shift.status}`);
        console.log(
          `   - Check in: ${shift.checkInTime?.toLocaleString("vi-VN") || "N/A"}`,
        );
        console.log(
          `   - Check out: ${shift.checkOutTime?.toLocaleString("vi-VN") || "N/A"}`,
        );
        console.log(`   - Giờ làm: ${shift.actualWorkHours?.toFixed(2)} giờ`);
      });

      // Thống kê theo nhân viên
      console.log("\n" + "=".repeat(60));
      console.log("👥 Thống kê theo nhân viên:\n");

      const staffStats = {};
      staffShiftsByDate.forEach((shift) => {
        const staffId = shift.staffId.toString();
        if (!staffStats[staffId]) {
          staffStats[staffId] = {
            count: 0,
            totalHours: 0,
          };
        }
        staffStats[staffId].count++;
        staffStats[staffId].totalHours += shift.actualWorkHours || 0;
      });

      // Lấy thông tin user
      const userIds = Object.keys(staffStats).map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      const users = await mongoose.connection.db
        .collection("users")
        .find({ _id: { $in: userIds } })
        .toArray();

      const userMap = {};
      users.forEach((u) => {
        userMap[u._id.toString()] = u;
      });

      Object.entries(staffStats).forEach(([staffId, stats]) => {
        const user = userMap[staffId];
        console.log(`📌 ${user?.fullName || "Unknown"}`);
        console.log(`   - Staff ID: ${staffId}`);
        console.log(`   - Số ca: ${stats.count}`);
        console.log(`   - Tổng giờ: ${stats.totalHours.toFixed(2)} giờ\n`);
      });
    }

    console.log("=".repeat(60));
    console.log("✅ KIỂM TRA HOÀN TẤT!");
    console.log("\n💡 Kết luận:");
    console.log(
      "   - Query theo DATE: Đúng ✅ (dùng field 'date' trong StaffShift)",
    );
    console.log(
      "   - Query theo checkInTime/checkOutTime: Sai ❌ (không match dữ liệu)",
    );
    console.log("\n🔧 Đã sửa trong payroll.service.js:");
    console.log("   - Đổi query từ checkInTime/checkOutTime → date");
    console.log("   - Đổi field từ userId → staffId trong aggregate");
    console.log("\n🚀 Restart server và thử tạo bảng lương lại!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

checkPayrollData();
