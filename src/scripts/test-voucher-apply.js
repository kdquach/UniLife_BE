/**
 * Test script for Voucher Apply feature
 * Run: node src/scripts/test-voucher-apply.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Voucher } from "../modules/voucher/voucher.model.js";
import { validateVoucherForApply } from "../modules/voucher/voucher.service.js";
import User from "../modules/user/user.model.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/unilife";

async function testVoucherApply() {
  console.log("🧪 Testing Voucher Apply Feature\n");

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find a test user
    const testUser = await User.findOne({ email: "customer1@gmail.com" });
    if (!testUser) {
      console.log("❌ Test user (customer1@gmail.com) not found");
      return;
    }
    console.log(`👤 Test user: ${testUser.fullName} (${testUser.email})\n`);

    // Create a test voucher if it doesn't exist
    let testVoucher = await Voucher.findOne({ code: "TEST10" });
    if (!testVoucher) {
      testVoucher = await Voucher.create({
        code: "TEST10",
        discountType: "percentage",
        value: 10,
        minOrderAmount: 50000,
        maxDiscount: 20000,
        maxUsage: 100,
        userUsageLimit: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        description: "Giảm 10% tối đa 20k",
      });
      console.log("✅ Created test voucher: TEST10\n");
    } else {
      console.log("📌 Using existing voucher: TEST10\n");
    }

    // Mock order items
    const mockItems = [
      { productId: "6793e1da0cb0f5e82f6ef6b4", quantity: 2, price: 35000 }, // 70k
      { productId: "6793e1da0cb0f5e82f6ef6b5", quantity: 1, price: 45000 }, // 45k
    ];
    const orderTotal = 115000;

    console.log("📦 Test order:");
    console.log(`   Subtotal: ${orderTotal.toLocaleString("vi-VN")}đ\n`);

    // Test Case 1: Valid voucher
    console.log("--- Test Case 1: Valid voucher ---");
    try {
      const result = await validateVoucherForApply(
        "TEST10",
        orderTotal,
        mockItems,
        null, // campusId (global voucher)
        testUser._id,
      );
      console.log("✅ Validation passed!");
      console.log(
        `   Discount: ${result.discountAmount.toLocaleString("vi-VN")}đ`,
      );
      console.log(`   Message: ${result.message}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }

    // Test Case 2: Invalid voucher code
    console.log("--- Test Case 2: Invalid voucher code ---");
    try {
      await validateVoucherForApply(
        "INVALID_CODE",
        orderTotal,
        mockItems,
        null,
        testUser._id,
      );
      console.log("❌ Should have thrown error!\n");
    } catch (error) {
      console.log(`✅ Correctly rejected: ${error.message}\n`);
    }

    // Test Case 3: Below minimum order
    console.log("--- Test Case 3: Below minimum order amount ---");
    try {
      await validateVoucherForApply(
        "TEST10",
        30000, // Below 50k minimum
        mockItems,
        null,
        testUser._id,
      );
      console.log("❌ Should have thrown error!\n");
    } catch (error) {
      console.log(`✅ Correctly rejected: ${error.message}\n`);
    }

    console.log("🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

testVoucherApply();
