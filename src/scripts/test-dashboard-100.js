import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as dashboardService from '../modules/dashboard/dashboard.service.js';
import Order from '../modules/order/order.model.js';
import User from '../modules/user/user.model.js';
import Product from '../modules/product/product.model.js';

dotenv.config();

const MONGODB_URI = "mongodb+srv://kdquach03_db_user:12345@unilife.xkiiiak.mongodb.net/unilife_db";
const CANTEEN_A_ID = "69a569107152973e4ed978ad";
const CANTEEN_B_ID = "69a569107152973e4ed978ae";
const TEST_NOTE_PREFIX = "[DASHBOARD_ISOLATION_TEST]";

async function runMassiveTest() {
  try {
    await mongoose.connect(MONGODB_URI);
    const now = new Date();
    console.log('🚀 Starting Data Isolation Dashboard Test (Canteen A vs Canteen B)...');

    // 1. Cleanup ALL orders for today in BOTH canteens
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const deleteResult = await Order.deleteMany({ 
        canteenId: { $in: [new mongoose.Types.ObjectId(CANTEEN_A_ID), new mongoose.Types.ObjectId(CANTEEN_B_ID)] },
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log(`🧹 Cleaned up ${deleteResult.deletedCount} orders for today.`);

    // 2. Fetch products for both
    const productsA = await Product.find({ canteenId: new mongoose.Types.ObjectId(CANTEEN_A_ID), status: 'available' });
    const productsB = await Product.find({ canteenId: new mongoose.Types.ObjectId(CANTEEN_B_ID), status: 'available' });
    
    const user = await User.findOne({ role: 'customer' });
    if (!user) throw new Error('No customer found');

    let expectedGrossA = 0;
    let expectedTxsA = 0;
    const ordersToCreate = [];

    console.log('Generating 100 orders for Canteen A...');
    for (let i = 0; i < 100; i++) {
        const product = productsA[i % productsA.length];
        const subTotal = product.price * (1 + (i % 2));
        const totalAmount = subTotal;
        const status = (i % 5 === 0) ? 'cancelled' : 'completed';
        const payStatus = 'completed';

        ordersToCreate.push({
            orderNumber: `A-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${i}`,
            userId: user._id,
            canteenId: new mongoose.Types.ObjectId(CANTEEN_A_ID),
            status,
            items: [{ productId: product._id, productName: product.name, quantity: 1 + (i % 2), price: product.price }],
            subTotal,
            totalAmount,
            payment: { method: 'cash', status: payStatus, amount: totalAmount },
            note: `${TEST_NOTE_PREFIX} Canteen A`,
            createdAt: new Date(startOfDay.getTime() + (i * 60000))
        });

        if (status === 'completed' && payStatus === 'completed') {
            expectedGrossA += totalAmount;
            expectedTxsA++;
        }
    }

    console.log('Generating 50 "noise" orders for Canteen B...');
    for (let i = 0; i < 50; i++) {
        const product = productsB[i % productsB.length] || productsA[0]; // fallback if B has no products
        const totalAmount = 50000; // obvious high value to detect if mixed in
        ordersToCreate.push({
            orderNumber: `B-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${i}`,
            userId: user._id,
            canteenId: new mongoose.Types.ObjectId(CANTEEN_B_ID),
            status: 'completed',
            items: [{ productId: product._id, productName: product.name, quantity: 1, price: 50000 }],
            subTotal: 50000,
            totalAmount: 50000,
            payment: { method: 'momo', status: 'completed', amount: 50000 },
            note: `${TEST_NOTE_PREFIX} Canteen B (NOISE)`,
            createdAt: new Date(startOfDay.getTime() + (i * 60000))
        });
    }

    console.log(`Inserting ${ordersToCreate.length} mixed orders...`);
    await Order.insertMany(ordersToCreate);

    // 3. Verify Isolation
    console.log('\n📊 Verifying Dashboard Isolation for Canteen A...');
    const revenueA = await dashboardService.getRevenueAggregation(CANTEEN_A_ID, { preset: 'today' });
    const actualGrossA = revenueA.summary.grossRevenue.value;
    const actualTxsA = revenueA.summary.transactions.value;

    console.log(`\nCanteen A Expected Gross: ${expectedGrossA} đ | Actual: ${actualGrossA} đ`);
    console.log(`Canteen A Expected Txs:   ${expectedTxsA} | Actual: ${actualTxsA}`);

    if (actualGrossA === expectedGrossA && actualTxsA === expectedTxsA) {
        console.log('✅ ISOLATION SUCCESS: Canteen A dashboard excludes Canteen B data!');
    } else {
        console.log('❌ ISOLATION FAILED: Canteen B data mixed into Canteen A!');
    }

    await mongoose.disconnect();
    console.log('\nIsolation test completed.');

  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runMassiveTest();
