/**
 * Seed Vouchers for UI Testing
 * Run: node src/scripts/seed-vouchers.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Voucher } from "../modules/voucher/voucher.model.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/unilife";

const vouchers = [
  {
    code: "WELCOME50",
    discountType: "percentage",
    value: 50,
    maxDiscount: 50000,
    minOrderAmount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    description: "Giảm 50% (tối đa 50k) cho bạn mới",
    userUsageLimit: 1, // Only once per user
    campusId: null, // Global
  },
  {
    code: "GIAM20K",
    discountType: "fixed",
    value: 20000,
    minOrderAmount: 100000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    description: "Giảm ngay 20k cho đơn từ 100k",
    userUsageLimit: 5,
    campusId: null,
  },
  {
    code: "FREESHIP",
    discountType: "fixed",
    value: 15000,
    minOrderAmount: 50000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
    description: "Hỗ trợ 15k phí ship cho đơn từ 50k",
    userUsageLimit: 10,
    campusId: null,
  },
  {
    code: "GIAM10",
    discountType: "percentage",
    value: 10,
    maxDiscount: 100000,
    minOrderAmount: 200000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    description: "Giảm 10% (tối đa 100k) cho đơn từ 200k",
    userUsageLimit: 3,
    campusId: null,
  },
  {
    code: "VIP500",
    discountType: "fixed",
    value: 100000,
    minOrderAmount: 500000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    description: "Giảm 100k cho đơn hàng lớn (từ 500k)",
    userUsageLimit: 1,
    campusId: null,
  },
];

async function seedVouchers() {
  console.log("🌱 Seeding Vouchers...\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Update or Insert (Upsert) to avoid duplicates error if run multiple times
    for (const v of vouchers) {
      await Voucher.findOneAndUpdate({ code: v.code }, v, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
      console.log(`   Processed: ${v.code} - ${v.description}`);
    }

    console.log("\n✅ Done! Added/Updated 5 sample vouchers.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected.");
  }
}

seedVouchers();
