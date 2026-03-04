import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

import User from "../modules/user/user.model.js";
import { Shift } from "../modules/shift/shift.model.js";
import { StaffShift } from "../modules/shift/staffShift.model.js";
import SalaryRate from "../modules/salaryRate/salaryRate.model.js";
import Payroll from "../modules/payroll/payroll.model.js";
import Salary from "../modules/salary/salary.model.js";

// Hàm random ngày giờ
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

const randomTime = (hour, minuteRange = 30) => {
  const minutes = Math.floor(Math.random() * minuteRange);
  return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Hàm tính khoảng thời gian phút giữa 2 thời điểm
const getMinutesDiff = (date1, date2) => {
  return Math.floor((date2 - date1) / 1000 / 60);
};

const seedPayrollTestData = async () => {
  try {
    console.log("🔌 Kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB");

    // =============== 1. LẤY DỮ LIỆU CƠ BẢN ===============
    console.log("\n📦 Lấy dữ liệu cơ bản...");

    // Lấy canteen đầu tiên (không filter isDeleted vì có thể không có field này)
    const canteen = await mongoose.connection.db
      .collection("canteens")
      .findOne({});

    if (!canteen) {
      throw new Error("Không tìm thấy canteen nào trong database");
    }
    console.log(`✅ Canteen: ${canteen.name} (${canteen._id})`);

    // Lấy manager/canteen_owner
    let manager = await User.findOne({
      canteenId: canteen._id,
      role: { $in: ["manager", "canteen_owner"] },
    });

    if (!manager) {
      console.log("⚠️ Không tìm thấy manager, tạo mới...");
      manager = await User.create({
        email: "manager@test.com",
        password:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHrHnK", // 123456
        fullName: "Quản lý Canteen",
        phone: "0901234567",
        role: "canteen_owner",
        status: "active",
        canteenId: canteen._id,
      });
      console.log(`✅ Tạo manager: ${manager.email}`);
    }

    // Tạo hoặc lấy staff
    console.log("\n👥 Tạo nhân viên test...");
    const staffData = [
      {
        email: "staff1@test.com",
        fullName: "Nguyễn Văn A",
        phone: "0901111111",
      },
      {
        email: "staff2@test.com",
        fullName: "Trần Thị B",
        phone: "0902222222",
      },
      {
        email: "staff3@test.com",
        fullName: "Lê Văn C",
        phone: "0903333333",
      },
      {
        email: "staff4@test.com",
        fullName: "Phạm Thị D",
        phone: "0904444444",
      },
      {
        email: "staff5@test.com",
        fullName: "Hoàng Văn E",
        phone: "0905555555",
      },
    ];

    const staffs = [];
    for (const data of staffData) {
      let staff = await User.findOne({ email: data.email });
      if (!staff) {
        staff = await User.create({
          ...data,
          password:
            "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHrHnK", // 123456
          role: "staff",
          status: "active",
          canteenId: canteen._id,
        });
        console.log(`✅ Tạo staff: ${staff.fullName}`);
      } else {
        console.log(`📌 Staff đã tồn tại: ${staff.fullName}`);
      }
      staffs.push(staff);
    }

    // =============== 2. TẠO SHIFTS ===============
    console.log("\n⏰ Tạo ca làm việc...");

    const shiftTemplates = [
      {
        name: "Ca Sáng",
        startTime: "07:00",
        endTime: "11:00",
        dayOfWeek: [1, 2, 3, 4, 5],
      },
      {
        name: "Ca Trưa",
        startTime: "11:00",
        endTime: "14:00",
        dayOfWeek: [1, 2, 3, 4, 5],
      },
      {
        name: "Ca Chiều",
        startTime: "14:00",
        endTime: "18:00",
        dayOfWeek: [1, 2, 3, 4, 5],
      },
      {
        name: "Ca Tối",
        startTime: "18:00",
        endTime: "21:00",
        dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
      },
    ];

    const shifts = [];
    for (const template of shiftTemplates) {
      let shift = await Shift.findOne({
        canteenId: canteen._id,
        name: template.name,
      });

      if (!shift) {
        shift = await Shift.create({
          canteenId: canteen._id,
          ...template,
          durationMinutes: 240,
          gracePeriodBefore: 15,
          gracePeriodAfter: 30,
          maxStaff: 5,
          status: "active",
        });
        console.log(`✅ Tạo shift: ${shift.name}`);
      } else {
        console.log(`📌 Shift đã tồn tại: ${shift.name}`);
      }
      shifts.push(shift);
    }

    // =============== 3. TẠO SALARY RATES ===============
    console.log("\n💰 Tạo cấu hình lương cho nhân viên...");

    const salaryRateConfigs = [
      // Staff 1: Nhân viên xuất sắc
      {
        userId: staffs[0]._id,
        hourlyRate: 80000,
        attendanceBonus100: 1000000,
        attendanceBonus95: 600000,
        attendanceBonus90: 300000,
        overtimeMultiplier: 2.0,
        lateDeduction: 100000,
        earlyLeaveDeduction: 50000,
        absentDeduction: 300000,
        maxLateAllowed: 2,
        note: "Nhân viên senior - mức cao",
      },
      // Staff 2: Nhân viên trung bình
      {
        userId: staffs[1]._id,
        hourlyRate: 60000,
        attendanceBonus100: 700000,
        attendanceBonus95: 400000,
        attendanceBonus90: 200000,
        overtimeMultiplier: 1.5,
        lateDeduction: 70000,
        earlyLeaveDeduction: 40000,
        absentDeduction: 250000,
        maxLateAllowed: 3,
        note: "Nhân viên trung cấp",
      },
      // Staff 3: Nhân viên mới
      {
        userId: staffs[2]._id,
        hourlyRate: 50000,
        attendanceBonus100: 500000,
        attendanceBonus95: 300000,
        attendanceBonus90: 100000,
        overtimeMultiplier: 1.5,
        lateDeduction: 50000,
        earlyLeaveDeduction: 30000,
        absentDeduction: 200000,
        maxLateAllowed: 3,
        note: "Nhân viên mới - mức cơ bản",
      },
      // Staff 4: Part-time
      {
        userId: staffs[3]._id,
        hourlyRate: 45000,
        attendanceBonus100: 400000,
        attendanceBonus95: 200000,
        attendanceBonus90: 100000,
        overtimeMultiplier: 1.3,
        lateDeduction: 40000,
        earlyLeaveDeduction: 25000,
        absentDeduction: 150000,
        maxLateAllowed: 2,
        note: "Part-time",
      },
      // Staff 5: Thử việc
      {
        userId: staffs[4]._id,
        hourlyRate: 40000,
        attendanceBonus100: 300000,
        attendanceBonus95: 150000,
        attendanceBonus90: 50000,
        overtimeMultiplier: 1.2,
        lateDeduction: 30000,
        earlyLeaveDeduction: 20000,
        absentDeduction: 100000,
        maxLateAllowed: 1,
        note: "Đang thử việc",
      },
    ];

    for (const config of salaryRateConfigs) {
      await SalaryRate.findOneAndUpdate(
        { userId: config.userId },
        {
          ...config,
          canteenId: canteen._id,
          effectiveFrom: new Date("2026-01-01"),
          updatedBy: manager._id,
        },
        { upsert: true, new: true },
      );
      const staff = staffs.find((s) => s._id.equals(config.userId));
      console.log(
        `✅ Cấu hình lương: ${staff.fullName} - ${config.hourlyRate}đ/giờ`,
      );
    }

    // =============== 4. TẠO STAFF SHIFTS - THÁNG 1/2026 ===============
    console.log("\n📅 Tạo dữ liệu chấm công tháng 01/2026...");

    const jan2026Start = new Date("2026-01-01");
    const jan2026End = new Date("2026-01-31");

    // Xóa dữ liệu cũ của tháng 1/2026
    await StaffShift.deleteMany({
      canteenId: canteen._id,
      date: { $gte: jan2026Start, $lte: jan2026End },
    });

    const staffShiftsJan = [];
    let currentDate = new Date(jan2026Start);

    while (currentDate <= jan2026End) {
      const dayOfWeek = currentDate.getDay();

      // Mỗi ngày assign ca cho 3-4 nhân viên ngẫu nhiên
      const selectedStaffs = staffs
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 2));

      for (const staff of selectedStaffs) {
        // Random 1-2 ca mỗi ngày
        const numShifts = 1 + Math.floor(Math.random() * 2);
        const selectedShifts = shifts
          .filter((s) => s.dayOfWeek.includes(dayOfWeek))
          .sort(() => Math.random() - 0.5)
          .slice(0, numShifts);

        for (const shift of selectedShifts) {
          const shiftDate = new Date(currentDate);

          // Parse shift time
          const [startHour, startMin] = shift.startTime.split(":").map(Number);
          const [endHour, endMin] = shift.endTime.split(":").map(Number);

          const shiftStart = new Date(shiftDate);
          shiftStart.setHours(startHour, startMin, 0, 0);

          const shiftEnd = new Date(shiftDate);
          shiftEnd.setHours(endHour, endMin, 0, 0);

          // Random attendance pattern
          const rand = Math.random();
          let status, attendanceStatus, checkInTime, checkOutTime;
          let lateMinutes = 0;
          let overtimeMinutes = 0;

          if (rand < 0.05) {
            // 5% nghỉ không phép
            status = "absent";
            attendanceStatus = null;
            checkInTime = null;
            checkOutTime = null;
          } else if (rand < 0.15) {
            // 10% đi muộn
            status = "checked_out";
            attendanceStatus = "late";
            lateMinutes = 15 + Math.floor(Math.random() * 45); // 15-60 phút
            checkInTime = new Date(shiftStart.getTime() + lateMinutes * 60000);
            checkOutTime = new Date(
              shiftEnd.getTime() + Math.random() * 30 * 60000,
            );
          } else if (rand < 0.2) {
            // 5% về sớm
            status = "checked_out";
            attendanceStatus = "early_leave";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 15 * 60000,
            );
            const earlyLeaveMin = 30 + Math.floor(Math.random() * 60);
            checkOutTime = new Date(shiftEnd.getTime() - earlyLeaveMin * 60000);
          } else if (rand < 0.3) {
            // 10% làm overtime
            status = "checked_out";
            attendanceStatus = "overtime";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 10 * 60000,
            );
            overtimeMinutes = 30 + Math.floor(Math.random() * 90); // 30-120 phút
            checkOutTime = new Date(
              shiftEnd.getTime() + overtimeMinutes * 60000,
            );
          } else {
            // 70% đúng giờ
            status = "checked_out";
            attendanceStatus = "on_time";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 10 * 60000,
            );
            checkOutTime = new Date(
              shiftEnd.getTime() + Math.random() * 10 * 60000,
            );
          }

          const actualWorkMinutes =
            checkInTime && checkOutTime
              ? getMinutesDiff(checkInTime, checkOutTime)
              : 0;

          staffShiftsJan.push({
            shiftId: shift._id,
            staffId: staff._id,
            canteenId: canteen._id,
            date: shiftDate,
            status,
            checkInTime,
            checkOutTime,
            actualWorkHours: actualWorkMinutes / 60,
            actualWorkMinutes,
            attendanceStatus,
            lateMinutes,
            overtimeMinutes,
            overtimeApproved: overtimeMinutes > 0,
            assignedBy: manager._id,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await StaffShift.insertMany(staffShiftsJan);
    console.log(`✅ Tạo ${staffShiftsJan.length} ca làm việc tháng 01/2026`);

    // =============== 5. TẠO STAFF SHIFTS - THÁNG 2/2026 ===============
    console.log("\n📅 Tạo dữ liệu chấm công tháng 02/2026...");

    const feb2026Start = new Date("2026-02-01");
    const feb2026End = new Date("2026-02-28");

    await StaffShift.deleteMany({
      canteenId: canteen._id,
      date: { $gte: feb2026Start, $lte: feb2026End },
    });

    const staffShiftsFeb = [];
    currentDate = new Date(feb2026Start);

    while (currentDate <= feb2026End) {
      const dayOfWeek = currentDate.getDay();

      const selectedStaffs = staffs
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 2));

      for (const staff of selectedStaffs) {
        const numShifts = 1 + Math.floor(Math.random() * 2);
        const selectedShifts = shifts
          .filter((s) => s.dayOfWeek.includes(dayOfWeek))
          .sort(() => Math.random() - 0.5)
          .slice(0, numShifts);

        for (const shift of selectedShifts) {
          const shiftDate = new Date(currentDate);

          const [startHour, startMin] = shift.startTime.split(":").map(Number);
          const [endHour, endMin] = shift.endTime.split(":").map(Number);

          const shiftStart = new Date(shiftDate);
          shiftStart.setHours(startHour, startMin, 0, 0);

          const shiftEnd = new Date(shiftDate);
          shiftEnd.setHours(endHour, endMin, 0, 0);

          const rand = Math.random();
          let status, attendanceStatus, checkInTime, checkOutTime;
          let lateMinutes = 0;
          let overtimeMinutes = 0;

          if (rand < 0.03) {
            status = "absent";
            attendanceStatus = null;
            checkInTime = null;
            checkOutTime = null;
          } else if (rand < 0.12) {
            status = "checked_out";
            attendanceStatus = "late";
            lateMinutes = 20 + Math.floor(Math.random() * 40);
            checkInTime = new Date(shiftStart.getTime() + lateMinutes * 60000);
            checkOutTime = new Date(
              shiftEnd.getTime() + Math.random() * 20 * 60000,
            );
          } else if (rand < 0.17) {
            status = "checked_out";
            attendanceStatus = "early_leave";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 15 * 60000,
            );
            const earlyLeaveMin = 30 + Math.floor(Math.random() * 60);
            checkOutTime = new Date(shiftEnd.getTime() - earlyLeaveMin * 60000);
          } else if (rand < 0.35) {
            status = "checked_out";
            attendanceStatus = "overtime";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 10 * 60000,
            );
            overtimeMinutes = 30 + Math.floor(Math.random() * 90);
            checkOutTime = new Date(
              shiftEnd.getTime() + overtimeMinutes * 60000,
            );
          } else {
            status = "checked_out";
            attendanceStatus = "on_time";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 10 * 60000,
            );
            checkOutTime = new Date(
              shiftEnd.getTime() + Math.random() * 10 * 60000,
            );
          }

          const actualWorkMinutes =
            checkInTime && checkOutTime
              ? getMinutesDiff(checkInTime, checkOutTime)
              : 0;

          staffShiftsFeb.push({
            shiftId: shift._id,
            staffId: staff._id,
            canteenId: canteen._id,
            date: shiftDate,
            status,
            checkInTime,
            checkOutTime,
            actualWorkHours: actualWorkMinutes / 60,
            actualWorkMinutes,
            attendanceStatus,
            lateMinutes,
            overtimeMinutes,
            overtimeApproved: overtimeMinutes > 0,
            assignedBy: manager._id,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await StaffShift.insertMany(staffShiftsFeb);
    console.log(`✅ Tạo ${staffShiftsFeb.length} ca làm việc tháng 02/2026`);

    // =============== 6. TẠO STAFF SHIFTS - THÁNG 3/2026 (Tháng hiện tại) ===============
    console.log(
      "\n📅 Tạo dữ liệu chấm công tháng 03/2026 (chỉ đến ngày hôm nay)...",
    );

    const mar2026Start = new Date("2026-03-01");
    const mar2026End = new Date(); // Ngày hôm nay
    mar2026End.setHours(23, 59, 59, 999);

    await StaffShift.deleteMany({
      canteenId: canteen._id,
      date: { $gte: mar2026Start, $lte: mar2026End },
    });

    const staffShiftsMar = [];
    currentDate = new Date(mar2026Start);

    while (currentDate <= mar2026End) {
      const dayOfWeek = currentDate.getDay();

      const selectedStaffs = staffs
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 2));

      for (const staff of selectedStaffs) {
        const numShifts = 1 + Math.floor(Math.random() * 2);
        const selectedShifts = shifts
          .filter((s) => s.dayOfWeek.includes(dayOfWeek))
          .sort(() => Math.random() - 0.5)
          .slice(0, numShifts);

        for (const shift of selectedShifts) {
          const shiftDate = new Date(currentDate);

          const [startHour, startMin] = shift.startTime.split(":").map(Number);
          const [endHour, endMin] = shift.endTime.split(":").map(Number);

          const shiftStart = new Date(shiftDate);
          shiftStart.setHours(startHour, startMin, 0, 0);

          const shiftEnd = new Date(shiftDate);
          shiftEnd.setHours(endHour, endMin, 0, 0);

          const rand = Math.random();
          let status, attendanceStatus, checkInTime, checkOutTime;
          let lateMinutes = 0;
          let overtimeMinutes = 0;

          if (rand < 0.02) {
            status = "absent";
            attendanceStatus = null;
            checkInTime = null;
            checkOutTime = null;
          } else if (rand < 0.1) {
            status = "checked_out";
            attendanceStatus = "late";
            lateMinutes = 15 + Math.floor(Math.random() * 45);
            checkInTime = new Date(shiftStart.getTime() + lateMinutes * 60000);
            checkOutTime = new Date(
              shiftEnd.getTime() + Math.random() * 20 * 60000,
            );
          } else if (rand < 0.15) {
            status = "checked_out";
            attendanceStatus = "early_leave";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 15 * 60000,
            );
            const earlyLeaveMin = 30 + Math.floor(Math.random() * 60);
            checkOutTime = new Date(shiftEnd.getTime() - earlyLeaveMin * 60000);
          } else if (rand < 0.4) {
            status = "checked_out";
            attendanceStatus = "overtime";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 10 * 60000,
            );
            overtimeMinutes = 30 + Math.floor(Math.random() * 90);
            checkOutTime = new Date(
              shiftEnd.getTime() + overtimeMinutes * 60000,
            );
          } else {
            status = "checked_out";
            attendanceStatus = "on_time";
            checkInTime = new Date(
              shiftStart.getTime() - Math.random() * 10 * 60000,
            );
            checkOutTime = new Date(
              shiftEnd.getTime() + Math.random() * 10 * 60000,
            );
          }

          const actualWorkMinutes =
            checkInTime && checkOutTime
              ? getMinutesDiff(checkInTime, checkOutTime)
              : 0;

          staffShiftsMar.push({
            shiftId: shift._id,
            staffId: staff._id,
            canteenId: canteen._id,
            date: shiftDate,
            status,
            checkInTime,
            checkOutTime,
            actualWorkHours: actualWorkMinutes / 60,
            actualWorkMinutes,
            attendanceStatus,
            lateMinutes,
            overtimeMinutes,
            overtimeApproved: overtimeMinutes > 0,
            assignedBy: manager._id,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await StaffShift.insertMany(staffShiftsMar);
    console.log(`✅ Tạo ${staffShiftsMar.length} ca làm việc tháng 03/2026`);

    // =============== 7. THỐNG KÊ ===============
    console.log("\n📊 Thống kê dữ liệu đã tạo:");
    console.log("=".repeat(60));

    for (const staff of staffs) {
      const jan = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: jan2026Start, $lte: jan2026End },
      });

      const feb = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: feb2026Start, $lte: feb2026End },
      });

      const mar = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: mar2026Start, $lte: mar2026End },
      });

      const janLate = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: jan2026Start, $lte: jan2026End },
        attendanceStatus: "late",
      });

      const febLate = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: feb2026Start, $lte: feb2026End },
        attendanceStatus: "late",
      });

      const marLate = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: mar2026Start, $lte: mar2026End },
        attendanceStatus: "late",
      });

      const janAbsent = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: jan2026Start, $lte: jan2026End },
        status: "absent",
      });

      const febAbsent = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: feb2026Start, $lte: feb2026End },
        status: "absent",
      });

      const marAbsent = await StaffShift.countDocuments({
        staffId: staff._id,
        date: { $gte: mar2026Start, $lte: mar2026End },
        status: "absent",
      });

      const salaryRate = await SalaryRate.findOne({ userId: staff._id });

      console.log(`\n👤 ${staff.fullName}`);
      console.log(
        `   💰 Lương giờ: ${salaryRate?.hourlyRate?.toLocaleString()}đ`,
      );
      console.log(
        `   📅 Tháng 1/2026: ${jan} ca (${janLate} muộn, ${janAbsent} vắng)`,
      );
      console.log(
        `   📅 Tháng 2/2026: ${feb} ca (${febLate} muộn, ${febAbsent} vắng)`,
      );
      console.log(
        `   📅 Tháng 3/2026: ${mar} ca (${marLate} muộn, ${marAbsent} vắng)`,
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ HOÀN TẤT SEED DỮ LIỆU TEST!");
    console.log("\n📝 Hướng dẫn sử dụng:");
    console.log("1. Đăng nhập với: manager@test.com / 123456");
    console.log("2. Vào 'Quản lý lương' > 'Bảng lương'");
    console.log("3. Click 'Tạo bảng lương mới' và chọn một trong các kỳ:");
    console.log("\n   📊 Kỳ lương cả tháng:");
    console.log("   - Tháng 1: 01/01/2026 - 31/01/2026");
    console.log("   - Tháng 2: 01/02/2026 - 28/02/2026");
    console.log("   - Tháng 3: 01/03/2026 - 04/03/2026 (đến hôm nay)");
    console.log("\n   📊 Hoặc tạo theo nửa tháng/tuần:");
    console.log("   - Nửa đầu tháng 2: 01/02/2026 - 15/02/2026");
    console.log("   - Nửa cuối tháng 2: 16/02/2026 - 28/02/2026");
    console.log("   - Tuần 1 tháng 2: 01/02/2026 - 07/02/2026");
    console.log("   - Tuần 2 tháng 2: 08/02/2026 - 14/02/2026");
    console.log("\n4. Hệ thống sẽ tự động tính lương với:");
    console.log("   ✓ Thưởng chuyên cần (theo % ca)");
    console.log("   ✓ Thưởng overtime");
    console.log("   ✓ Phạt đi muộn, về sớm, nghỉ KP");
    console.log("5. Xem chi tiết từng nhân viên trong payroll");
    console.log("6. Điều chỉnh lương nếu cần (xem SalaryRate config)");
    console.log("\n💡 LƯU Ý:");
    console.log("   - Có thể tạo NHIỀU kỳ lương khác nhau cho cùng 1 tháng");
    console.log("   - Chỉ cần periodStart/periodEnd khác nhau là được");
    console.log("   - Ví dụ: Kỳ 1 (01-15/02) + Kỳ 2 (16-28/02) ✅");
    console.log("   - Không được: 2 kỳ cùng (01-28/02) ❌");
    console.log("\n" + "=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

seedPayrollTestData();
