import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// User IDs (Dựa trên testVoucherAdvanced.js)
const ADMIN_ID = new mongoose.Types.ObjectId("69a569107152973e4ed978ad");
const MANAGER_ID = new mongoose.Types.ObjectId("69a569107152973e4ed978ad");

// Dummy User/Order IDs cho Usage History
const DUMMY_USER_IDS = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

// Canteen IDs
const CANTEENS = [
  new mongoose.Types.ObjectId("69a569107152973e4ed978ad"), // Canteen của Manager
  new mongoose.Types.ObjectId("69a858d492fada961d334900"), // Canteen khác
];

const STATES = [
  "Draft",
  "Upcoming",
  "Active",
  "Inactive",
  "Expired",
  "OutOfQuota",
  "Archived",
];
const SCOPES = ["Global", "Branch"];
const DISCOUNT_TYPES = ["Percentage", "Fixed Amount"];
const APPLY_TOS = ["All items", "Specific items", "Category", "Combo only"];

// Helper
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBoolean = () => Math.random() < 0.5;

function generateRandomVoucher(index) {
  const isPercentage = randomItem(DISCOUNT_TYPES) === "Percentage";
  const scope = randomItem(SCOPES);
  const state = randomItem(STATES);

  // Date logic based on state
  const now = new Date();
  let startDatetime = new Date();
  let endDatetime = new Date();

  if (state === "Draft" || state === "Upcoming") {
    startDatetime.setDate(now.getDate() + randomInt(1, 5)); // Future
    endDatetime.setDate(startDatetime.getDate() + randomInt(5, 10));
  } else if (
    state === "Active" ||
    state === "Inactive" ||
    state === "OutOfQuota"
  ) {
    startDatetime.setDate(now.getDate() - randomInt(1, 5)); // Past
    endDatetime.setDate(now.getDate() + randomInt(5, 10)); // Future
  } else if (state === "Expired" || state === "Archived") {
    startDatetime.setDate(now.getDate() - randomInt(10, 15)); // Past
    endDatetime.setDate(now.getDate() - randomInt(1, 5)); // Past
  }

  // Quota logic
  const totalLimit = randomBoolean() ? randomInt(50, 500) : null;
  let usedCount = 0;
  if (state === "OutOfQuota" && totalLimit) {
    usedCount = totalLimit;
  } else if (state !== "Draft" && state !== "Upcoming") {
    usedCount = totalLimit ? randomInt(10, totalLimit - 1) : randomInt(10, 200);
  }

  return {
    _id: new mongoose.Types.ObjectId(), // Tạo sẵn block objectId
    code: `SEED_${Math.random().toString(36).substring(2, 6).toUpperCase()}_${index}`,
    name: `Chương trình Khuyến mãi ${index} - ${randomItem(["Tết", "Hè", "Tựu Trường", "Cuối Tuần"])}`,
    internalDescription: `Dữ liệu seed tự động sinh (#${index}) để test UI ${state}`,
    displayDescription: isPercentage
      ? `Giảm ${randomInt(5, 30)}% tối đa 50k`
      : `Giảm thẳng ${randomInt(10, 50)}k cho đơn hàng`,
    scope,
    canteen_ids: scope === "Branch" ? [randomItem(CANTEENS)] : [],
    applyTo: randomItem(APPLY_TOS),
    categoryIds: [],
    productIds: [],
    discountType: isPercentage ? "Percentage" : "Fixed Amount",
    discountValue: isPercentage ? randomInt(5, 50) : randomInt(10, 100) * 1000,
    maxDiscountCap: isPercentage ? randomInt(3, 10) * 10000 : undefined,
    minOrderValue: randomInt(0, 5) * 20000,
    minItemQuantity: randomInt(0, 3),
    startDatetime,
    endDatetime,
    totalLimit,
    usedCount,
    usagePerUser: randomInt(1, 5),
    allowStackWithCombo: randomBoolean(),
    state,
    createdBy: randomBoolean() ? ADMIN_ID : MANAGER_ID,
  };
}

function generateUsageHistory(voucher) {
  if (voucher.usedCount === 0) return [];

  const histories = [];
  const canteenId =
    voucher.scope === "Branch" && voucher.canteen_ids.length > 0
      ? voucher.canteen_ids[0]
      : randomItem(CANTEENS);

  for (let i = 0; i < voucher.usedCount; i++) {
    const originalAmount = randomInt(5, 30) * 10000; // 50k -> 300k
    let discountAmount = 0;

    if (voucher.discountType === "Percentage") {
      discountAmount = Math.floor(
        (originalAmount * voucher.discountValue) / 100,
      );
      if (voucher.maxDiscountCap) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscountCap);
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    // Không bao giờ giảm quá số tiền gốc
    discountAmount = Math.min(discountAmount, originalAmount);
    const finalAmount = originalAmount - discountAmount;

    // Ngày sử dụng phải nằm trong khoảng thời gian voucher (hoặc trước ngày hiện tại)
    let createdTime = new Date();
    const start = voucher.startDatetime.getTime();
    const minBound = Math.min(Date.now(), start); // Đảm bảo ko vượt quá quá khứ
    createdTime = new Date(randomInt(minBound, Date.now()));

    histories.push({
      voucherId: voucher._id,
      orderId: new mongoose.Types.ObjectId(), // Dummy order ID
      userId: randomItem(DUMMY_USER_IDS), // Dummy user ID
      canteenId,
      originalAmount,
      discountAmount,
      finalAmount,
      orderStatus: randomItem([
        "Completed",
        "Completed",
        "Completed",
        "Pending",
        "Cancelled",
      ]),
      voucherStatus: randomBoolean() ? "Consumed" : "Consumed",
      createdAt: createdTime,
      updatedAt: createdTime,
    });
  }
  return histories;
}

async function seedVouchers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    const { Voucher } = await import("./src/modules/voucher/voucher.model.js");
    const { VoucherUsageHistory } =
      await import("./src/modules/voucher/voucherHistory.model.js");

    // Clear old seed data if any
    const vouchersToDelete = await Voucher.find(
      { code: { $regex: "^SEED_" } },
      { _id: 1 },
    );
    const deleteIds = vouchersToDelete.map((v) => v._id);

    if (deleteIds.length > 0) {
      await Voucher.deleteMany({ _id: { $in: deleteIds } });
      await VoucherUsageHistory.deleteMany({ voucherId: { $in: deleteIds } });
      console.log(
        `Deleted ${deleteIds.length} old seed vouchers and their histories.`,
      );
    }

    // Generate 50 vouchers
    const vouchersToInsert = Array.from({ length: 50 }, (_, i) =>
      generateRandomVoucher(i + 1),
    );

    // Generate usage histories for all these vouchers based on their usedCount
    let allHistories = [];
    vouchersToInsert.forEach((voucher) => {
      const histories = generateUsageHistory(voucher);
      allHistories = allHistories.concat(histories);
    });

    const insertVouchersRes = await Voucher.insertMany(vouchersToInsert);
    console.log(`Successfully seeded ${insertVouchersRes.length} vouchers!`);

    if (allHistories.length > 0) {
      const insertHistoriesRes =
        await VoucherUsageHistory.insertMany(allHistories);
      console.log(
        `Successfully seeded ${insertHistoriesRes.length} usage histories (Doanh thu)!`,
      );
    }

    await mongoose.disconnect();
    console.log("Done.");
  } catch (error) {
    console.error("Failed to seed vouchers:", error);
    process.exit(1);
  }
}

seedVouchers();
