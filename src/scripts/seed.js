import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config();

// Import models
import User from '../modules/user/user.model.js';
import {
  Role,
  Permission,
  RolePermission,
  UserRole,
} from '../modules/role/role.model.js';
import Campus from '../modules/campus/campus.model.js';
import Canteen from '../modules/canteen/canteen.model.js';
import ProductCategory from '../modules/productCategory/productCategory.model.js';
import IngredientCategory from '../modules/ingredientCategory/ingredientCategory.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import Product from '../modules/product/product.model.js';
import Menu from '../modules/menu/menu.model.js';
import MenuSchedule from '../modules/menu/menuSchedule.model.js';
import Order from '../modules/order/order.model.js';
import { Cart } from '../modules/cart/cart.model.js';
import { Shift, StaffShift } from '../modules/shift/shift.model.js';
import { Voucher, VoucherUsage } from '../modules/voucher/voucher.model.js';
import { Banner } from '../modules/banner/banner.model.js';
import { Feedback } from '../modules/feedback/feedback.model.js';
import { FeedbackReply } from '../modules/feedbackReply/feedbackReply.model.js';
import Salary from '../modules/salary/salary.model.js';
import {
  Notification,
  SystemNotification,
} from '../modules/notification/notification.model.js';
import {
  ReportSnapshot,
  AuditLog,
  ShiftSummary,
  PickupLog,
} from '../modules/report/report.model.js';
import connectDB from '../config/db.js';

// Connect to database
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await RolePermission.deleteMany({});
    await UserRole.deleteMany({});
    await Campus.deleteMany({});
    await Canteen.deleteMany({});
    await ProductCategory.deleteMany({});
    await IngredientCategory.deleteMany({});
    await Ingredient.deleteMany({});
    await Product.deleteMany({});
    await Menu.deleteMany({});
    await MenuSchedule.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Shift.deleteMany({});
    await StaffShift.deleteMany({});
    await Voucher.deleteMany({});
    await VoucherUsage.deleteMany({});
    await Banner.deleteMany({});
    await Feedback.deleteMany({});
    await FeedbackReply.deleteMany({});
    await Salary.deleteMany({});
    await Notification.deleteMany({});
    await SystemNotification.deleteMany({});
    await ReportSnapshot.deleteMany({});
    await AuditLog.deleteMany({});
    await ShiftSummary.deleteMany({});
    await PickupLog.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // ============ Seed Users ============
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('123456', 12);

    const adminUser = await User.create({
      email: 'admin@unilife.com',
      password: hashedPassword,
      fullName: 'Admin User',
      phone: '0123456789',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });

    const managerUser = await User.create({
      email: 'manager@unilife.com',
      password: hashedPassword,
      fullName: 'Manager User',
      phone: '0123456788',
      role: 'manager',
      status: 'active',
      emailVerified: true,
    });

    const staffUser = await User.create({
      email: 'staff@unilife.com',
      password: hashedPassword,
      fullName: 'Staff User',
      phone: '0123456787',
      role: 'staff',
      status: 'active',
      emailVerified: true,
    });

    const customers = await User.insertMany([
      {
        email: 'customer1@gmail.com',
        password: hashedPassword,
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        role: 'customer',
        status: 'active',
        balance: 500000,
        emailVerified: true,
      },
      {
        email: 'customer2@gmail.com',
        password: hashedPassword,
        fullName: 'Trần Thị B',
        phone: '0987654322',
        role: 'customer',
        status: 'active',
        balance: 300000,
        emailVerified: true,
      },
      {
        email: 'customer3@gmail.com',
        password: hashedPassword,
        fullName: 'Lê Văn C',
        phone: '0987654323',
        role: 'customer',
        status: 'active',
        balance: 200000,
        emailVerified: true,
      },
    ]);

    console.log(`✅ Created ${3 + customers.length} users\n`);

    // ============ Seed Campus ============
    console.log('🏫 Creating campus...');
    const campuses = await Campus.insertMany([
      {
        name: 'FPT University HCMC',
        code: 'HCM',
        address:
          'Lô E2a-7, Đường D1, Khu Công nghệ cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP. HCM',
        status: 'active',
      },
      {
        name: 'FPT University Hanoi',
        code: 'HN',
        address:
          'Khu Giáo dục và Đào tạo, Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Hà Nội',
        status: 'active',
      },
      {
        name: 'FPT University Da Nang',
        code: 'DN',
        address:
          'Khu đô thị công nghệ FPT Đà Nẵng, P. Hòa Hải, Q. Ngũ Hành Sơn, TP. Đà Nẵng',
        status: 'active',
      },
    ]);
    console.log(`✅ Created ${campuses.length} campuses\n`);

    // ============ Seed Canteens ============
    console.log('🏢 Creating canteens...');
    const canteens = await Canteen.insertMany([
      {
        name: 'Canteen A - Khu A',
        location: 'Khu A, Tầng 1',
        campusId: campuses[0]._id,
        status: 'active',
      },
      {
        name: 'Canteen B - Khu B',
        location: 'Khu B, Tầng 2',
        campusId: campuses[0]._id,
        status: 'active',
      },
      {
        name: 'Canteen C - Khu C',
        location: 'Khu C, Tầng 1',
        campusId: campuses[1]._id,
        status: 'active',
      },
    ]);
    console.log(`✅ Created ${canteens.length} canteens\n`);

    // Update staff and manager with canteen (cả hai có quyền như nhau)
    staffUser.canteenId = canteens[0]._id;
    await staffUser.save();

    managerUser.canteenId = canteens[0]._id;
    await managerUser.save();

    // ============ Seed Categories ============
    console.log('📂 Creating categories...');
    const productCategories = await ProductCategory.insertMany([
      {
        name: 'Cơm',
        description: 'Các món cơm',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Phở',
        description: 'Các món phở',
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'Bún',
        description: 'Các món bún',
        displayOrder: 3,
        isActive: true,
      },
      {
        name: 'Mì',
        description: 'Các món mì',
        displayOrder: 4,
        isActive: true,
      },
      {
        name: 'Đồ uống',
        description: 'Nước giải khát',
        displayOrder: 5,
        isActive: true,
      },
      {
        name: 'Tráng miệng',
        description: 'Món tráng miệng',
        displayOrder: 6,
        isActive: true,
      },
      {
        name: 'Ăn vặt',
        description: 'Đồ ăn vặt',
        displayOrder: 7,
        isActive: true,
      },
    ]);

    const ingredientCategories = await IngredientCategory.insertMany([
      { name: 'Thịt', description: 'Các loại thịt', isActive: true },
      { name: 'Rau củ', description: 'Rau và củ quả', isActive: true },
      { name: 'Gia vị', description: 'Gia vị nấu ăn', isActive: true },
      { name: 'Nguyên liệu khô', description: 'Gạo, bún, mì', isActive: true },
    ]);
    console.log(
      `✅ Created ${productCategories.length + ingredientCategories.length} categories\n`
    );

    // ============ Seed Ingredients ============
    console.log('🥬 Creating ingredients...');
    const ingredients = await Ingredient.insertMany([
      {
        canteenId: canteens[0]._id,
        name: 'Gạo',
        categoryId: ingredientCategories[3]._id,
        unit: 'kg',
        stock: 500,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Thịt heo',
        categoryId: ingredientCategories[0]._id,
        unit: 'kg',
        stock: 50,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Thịt gà',
        categoryId: ingredientCategories[0]._id,
        unit: 'kg',
        stock: 40,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Cà chua',
        categoryId: ingredientCategories[1]._id,
        unit: 'kg',
        stock: 30,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Rau xà lách',
        categoryId: ingredientCategories[1]._id,
        unit: 'kg',
        stock: 20,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Dầu ăn',
        categoryId: ingredientCategories[2]._id,
        unit: 'lít',
        stock: 100,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Nước mắm',
        categoryId: ingredientCategories[2]._id,
        unit: 'lít',
        stock: 50,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Phở khô',
        categoryId: ingredientCategories[3]._id,
        unit: 'kg',
        stock: 100,
      },
      {
        canteenId: canteens[0]._id,
        name: 'Bún tươi',
        categoryId: ingredientCategories[3]._id,
        unit: 'kg',
        stock: 80,
      },
    ]);
    console.log(`✅ Created ${ingredients.length} ingredients\n`);

    // ============ Seed Products ============
    console.log('🍽️  Creating products...');
    const products = await Product.insertMany([
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[0]._id,
        name: 'Cơm sườn',
        slug: 'com-suon',
        price: 35000,
        originalPrice: 40000,
        status: 'available',
        description: 'Cơm sườn nướng thơm ngon',
        image: 'https://via.placeholder.com/400',
        calories: 650,
        preparationTime: 15,
        isPopular: true,
        stockQuantity: 50,
        recipe: [
          {
            ingredientId: ingredients[0]._id,
            ingredientName: 'Gạo',
            quantity: 0.2,
            unit: 'kg',
          },
          {
            ingredientId: ingredients[1]._id,
            ingredientName: 'Thịt heo',
            quantity: 0.15,
            unit: 'kg',
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[0]._id,
        name: 'Cơm gà',
        slug: 'com-ga',
        price: 35000,
        status: 'available',
        description: 'Cơm gà chiên nước mắm',
        image: 'https://via.placeholder.com/400',
        calories: 600,
        preparationTime: 15,
        isPopular: true,
        stockQuantity: 50,
        recipe: [
          {
            ingredientId: ingredients[0]._id,
            ingredientName: 'Gạo',
            quantity: 0.2,
            unit: 'kg',
          },
          {
            ingredientId: ingredients[2]._id,
            ingredientName: 'Thịt gà',
            quantity: 0.15,
            unit: 'kg',
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[1]._id,
        name: 'Phở bò',
        slug: 'pho-bo',
        price: 40000,
        status: 'available',
        description: 'Phở bò Hà Nội truyền thống',
        image: 'https://via.placeholder.com/400',
        calories: 500,
        preparationTime: 20,
        isPopular: true,
        stockQuantity: 30,
        recipe: [
          {
            ingredientId: ingredients[7]._id,
            ingredientName: 'Phở khô',
            quantity: 0.3,
            unit: 'kg',
          },
          {
            ingredientId: ingredients[1]._id,
            ingredientName: 'Thịt heo',
            quantity: 0.1,
            unit: 'kg',
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[2]._id,
        name: 'Bún chả',
        slug: 'bun-cha',
        price: 35000,
        status: 'available',
        description: 'Bún chả Hà Nội',
        image: 'https://via.placeholder.com/400',
        calories: 550,
        preparationTime: 15,
        stockQuantity: 40,
        recipe: [
          {
            ingredientId: ingredients[8]._id,
            ingredientName: 'Bún tươi',
            quantity: 0.3,
            unit: 'kg',
          },
          {
            ingredientId: ingredients[1]._id,
            ingredientName: 'Thịt heo',
            quantity: 0.15,
            unit: 'kg',
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[4]._id,
        name: 'Trà đá',
        slug: 'tra-da',
        price: 5000,
        status: 'available',
        description: 'Trà đá mát lạnh',
        image: 'https://via.placeholder.com/400',
        preparationTime: 2,
        stockQuantity: 100,
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[4]._id,
        name: 'Coca Cola',
        slug: 'coca-cola',
        price: 15000,
        status: 'available',
        description: 'Coca Cola lon 330ml',
        image: 'https://via.placeholder.com/400',
        stockQuantity: 100,
      },
      {
        canteenId: canteens[1]._id,
        categoryId: productCategories[0]._id,
        name: 'Cơm tấm',
        slug: 'com-tam',
        price: 30000,
        status: 'available',
        description: 'Cơm tấm sườn bì chả',
        image: 'https://via.placeholder.com/400',
        calories: 600,
        preparationTime: 15,
        stockQuantity: 50,
      },
      {
        canteenId: canteens[1]._id,
        categoryId: productCategories[3]._id,
        name: 'Mì Ý',
        slug: 'mi-y',
        price: 45000,
        status: 'available',
        description: 'Mì Ý sốt bò băm',
        image: 'https://via.placeholder.com/400',
        calories: 550,
        preparationTime: 20,
        isNew: true,
        stockQuantity: 30,
      },
    ]);
    console.log(`✅ Created ${products.length} products\n`);

    // ============ Seed Menus ============
    console.log('📋 Creating menus...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const menus = await Menu.insertMany([
      {
        canteenId: canteens[0]._id,
        date: today,
        status: 'active',
        items: [
          {
            productId: products[0]._id,
            order: 1,
          },
          {
            productId: products[1]._id,
            order: 2,
          },
          {
            productId: products[4]._id,
            order: 3,
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        date: tomorrow,
        status: 'active',
        items: [
          {
            productId: products[0]._id,
            order: 1,
          },
          {
            productId: products[2]._id,
            order: 2,
          },
          {
            productId: products[3]._id,
            order: 3,
          },
        ],
      },
    ]);
    console.log(`✅ Created ${menus.length} menus\n`);

    // ============ Seed Shifts ============
    console.log('⏰ Creating shifts...');
    const shifts = await Shift.insertMany([
      {
        canteenId: canteens[0]._id,
        name: 'Ca Sáng',
        startTime: '06:00',
        endTime: '12:00',
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        maxStaff: 5,
        status: 'active',
      },
      {
        canteenId: canteens[0]._id,
        name: 'Ca Chiều',
        startTime: '12:00',
        endTime: '18:00',
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        maxStaff: 5,
        status: 'active',
      },
      {
        canteenId: canteens[0]._id,
        name: 'Ca Tối',
        startTime: '18:00',
        endTime: '22:00',
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        maxStaff: 3,
        status: 'active',
      },
    ]);
    console.log(`✅ Created ${shifts.length} shifts\n`);

    // ============ Seed Vouchers ============
    console.log('🎟️  Creating vouchers...');
    const vouchers = await Voucher.insertMany([
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho đơn hàng đầu tiên',
        discountType: 'percentage',
        value: 10,
        maxDiscount: 50000,
        minOrderAmount: 100000,
        maxUsage: 100,
        usedCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'FREESHIP',
        description: 'Miễn phí ship cho đơn từ 200k',
        discountType: 'fixed',
        value: 20000,
        minOrderAmount: 200000,
        maxUsage: 50,
        usedCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'LUNCH50',
        description: 'Giảm 50k cho đơn hàng bữa trưa',
        discountType: 'fixed',
        value: 50000,
        minOrderAmount: 150000,
        maxUsage: 30,
        usedCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${vouchers.length} vouchers\n`);

    // ============ Seed Banners ============
    console.log('🎨 Creating banners...');
    const banners = await Banner.insertMany([
      {
        canteenId: canteens[0]._id,
        title: 'Khuyến mãi đặc biệt',
        imageUrl: 'https://via.placeholder.com/1920x600',
        linkUrl: '/promotions',
        order: 1,
        isActive: true,
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        canteenId: canteens[0]._id,
        title: 'Menu mới tuần này',
        imageUrl: 'https://via.placeholder.com/1920x600',
        linkUrl: '/menu',
        order: 2,
        isActive: true,
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
    ]);
    console.log(`✅ Created ${banners.length} banners\n`);

    // ============ Seed Sample Orders ============
    console.log('🛒 Creating sample orders...');
    // Use create() instead of insertMany() to trigger pre-save hooks for orderNumber generation
    const order1 = await Order.create({
      userId: customers[0]._id,
      canteenId: canteens[0]._id,
      status: 'completed',
      subTotal: 80000,
      discount: 0,
      totalAmount: 80000,
      items: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          quantity: 1,
          price: 35000,
        },
        {
          productId: products[2]._id,
          productName: products[2].name,
          quantity: 1,
          price: 40000,
        },
        {
          productId: products[4]._id,
          productName: products[4].name,
          quantity: 1,
          price: 5000,
        },
      ],
      payment: {
        method: 'balance',
        status: 'completed',
        paidAt: new Date(),
        amount: 80000,
      },
      completedAt: new Date(),
    });

    const order2 = await Order.create({
      userId: customers[1]._id,
      canteenId: canteens[0]._id,
      status: 'ready',
      subTotal: 70000,
      discount: 0,
      totalAmount: 70000,
      items: [
        {
          productId: products[1]._id,
          productName: products[1].name,
          quantity: 2,
          price: 35000,
        },
      ],
      payment: {
        method: 'momo',
        status: 'completed',
        paidAt: new Date(),
        amount: 70000,
      },
      preparedAt: new Date(),
    });

    const orders = [order1, order2];
    console.log(`✅ Created ${orders.length} sample orders\n`);

    // ============ Seed Feedbacks ============
    console.log('💬 Creating feedbacks...');
    const feedbacks = await Feedback.insertMany([
      {
        userId: customers[0]._id,
        orderId: orders[0]._id,
        productId: products[0]._id,
        rating: 5,
        comment: 'Rất ngon, phục vụ nhanh!',
      },
      {
        userId: customers[1]._id,
        orderId: orders[1]._id,
        productId: products[1]._id,
        rating: 4,
        comment: 'Cơm gà ngon, nhưng hơi ít',
      },
    ]);
    console.log(`✅ Created ${feedbacks.length} feedbacks\n`);

    // ============ Seed Roles & Permissions ============
    console.log('🔐 Creating roles and permissions...');
    const roles = await Role.insertMany([
      { roleName: 'admin', description: 'Quản trị viên hệ thống' },
      { roleName: 'staff', description: 'Nhân viên căng tin' },
      { roleName: 'customer', description: 'Khách hàng' },
    ]);

    const permissions = await Permission.insertMany([
      { code: 'USER_READ', description: 'Xem thông tin người dùng' },
      { code: 'USER_CREATE', description: 'Tạo người dùng mới' },
      { code: 'USER_UPDATE', description: 'Cập nhật thông tin người dùng' },
      { code: 'USER_DELETE', description: 'Xóa người dùng' },
      { code: 'PRODUCT_READ', description: 'Xem sản phẩm' },
      { code: 'PRODUCT_CREATE', description: 'Tạo sản phẩm mới' },
      { code: 'PRODUCT_UPDATE', description: 'Cập nhật sản phẩm' },
      { code: 'PRODUCT_DELETE', description: 'Xóa sản phẩm' },
      { code: 'PRODUCT_CATEGORY_READ', description: 'Xem danh mục sản phẩm' },
      { code: 'PRODUCT_CATEGORY_CREATE', description: 'Tạo danh mục sản phẩm' },
      {
        code: 'PRODUCT_CATEGORY_UPDATE',
        description: 'Cập nhật danh mục sản phẩm',
      },
      { code: 'PRODUCT_CATEGORY_DELETE', description: 'Xóa danh mục sản phẩm' },
      { code: 'ORDER_READ', description: 'Xem đơn hàng' },
      { code: 'ORDER_CREATE', description: 'Tạo đơn hàng' },
      { code: 'ORDER_UPDATE', description: 'Cập nhật đơn hàng' },
      { code: 'ORDER_DELETE', description: 'Xóa đơn hàng' },
      { code: 'REPORT_READ', description: 'Xem báo cáo' },
      { code: 'REPORT_EXPORT', description: 'Xuất báo cáo' },
      { code: 'SHIFT_MANAGE', description: 'Quản lý ca làm việc' },
      { code: 'SALARY_MANAGE', description: 'Quản lý lương' },
    ]);

    // Assign all permissions to admin role
    const adminRole = roles.find((r) => r.roleName === 'admin');
    const staffRole = roles.find((r) => r.roleName === 'staff');
    const customerRole = roles.find((r) => r.roleName === 'customer');

    const rolePermissions = await RolePermission.insertMany([
      // Admin gets all permissions
      ...permissions.map((p) => ({
        roleId: adminRole._id,
        permissionId: p._id,
      })),
      // Staff gets product, order permissions
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === 'PRODUCT_READ')._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === 'PRODUCT_UPDATE')._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find(
          (p) => p.code === 'PRODUCT_CATEGORY_READ'
        )._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find(
          (p) => p.code === 'PRODUCT_CATEGORY_CREATE'
        )._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find(
          (p) => p.code === 'PRODUCT_CATEGORY_UPDATE'
        )._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === 'ORDER_READ')._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === 'ORDER_UPDATE')._id,
      },
      // Customer gets basic permissions
      {
        roleId: customerRole._id,
        permissionId: permissions.find((p) => p.code === 'PRODUCT_READ')._id,
      },
      {
        roleId: customerRole._id,
        permissionId: permissions.find(
          (p) => p.code === 'PRODUCT_CATEGORY_READ'
        )._id,
      },
      {
        roleId: customerRole._id,
        permissionId: permissions.find((p) => p.code === 'ORDER_READ')._id,
      },
      {
        roleId: customerRole._id,
        permissionId: permissions.find((p) => p.code === 'ORDER_CREATE')._id,
      },
    ]);

    // Assign roles to users
    const userRoles = await UserRole.insertMany([
      { userId: adminUser._id, roleId: adminRole._id },
      { userId: managerUser._id, roleId: adminRole._id },
      { userId: staffUser._id, roleId: staffRole._id },
      { userId: customers[0]._id, roleId: customerRole._id },
      { userId: customers[1]._id, roleId: customerRole._id },
      { userId: customers[2]._id, roleId: customerRole._id },
    ]);
    console.log(
      `✅ Created ${roles.length} roles, ${permissions.length} permissions\n`
    );

    // ============ Seed Menu Schedules ============
    console.log('📅 Creating menu schedules...');
    const menuSchedules = await MenuSchedule.insertMany([
      {
        menuId: menus[0]._id,
        canteenId: canteens[0]._id,
        startDate: today,
        endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        startTime: '06:00',
        endTime: '11:00',
        status: 'active',
      },
      {
        menuId: menus[1]._id,
        canteenId: canteens[0]._id,
        startDate: today,
        endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        startTime: '11:00',
        endTime: '14:00',
        status: 'active',
      },
    ]);
    console.log(`✅ Created ${menuSchedules.length} menu schedules\n`);

    // ============ Seed Carts ============
    console.log('🛒 Creating carts...');
    const carts = await Cart.insertMany([
      {
        userId: customers[0]._id,
        canteenId: canteens[0]._id,
        items: [
          { productId: products[0]._id, quantity: 2 },
          { productId: products[4]._id, quantity: 1 },
        ],
        totalPrice: 75000,
      },
      {
        userId: customers[1]._id,
        canteenId: canteens[0]._id,
        items: [{ productId: products[2]._id, quantity: 1 }],
        totalPrice: 40000,
      },
    ]);
    console.log(`✅ Created ${carts.length} carts\n`);

    // ============ Seed Salaries ============
    console.log('💰 Creating salaries...');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const periodStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );
    const periodEnd = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    );

    const salaries = await Salary.insertMany([
      {
        userId: staffUser._id,
        canteenId: canteens[0]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        totalHours: 160,
        baseSalary: 8000000,
        bonus: 500000,
        deduction: 0,
        status: 'paid',
        paidAt: new Date(),
        note: 'Lương tháng ' + (lastMonth.getMonth() + 1),
      },
      {
        userId: managerUser._id,
        canteenId: canteens[0]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        totalHours: 176,
        baseSalary: 12000000,
        bonus: 1000000,
        deduction: 200000,
        status: 'paid',
        paidAt: new Date(),
        note: 'Lương tháng ' + (lastMonth.getMonth() + 1),
      },
    ]);
    console.log(`✅ Created ${salaries.length} salary records\n`);

    // ============ Seed Notifications ============
    console.log('🔔 Creating notifications...');
    const notifications = await Notification.insertMany([
      {
        userId: customers[0]._id,
        canteenId: canteens[0]._id,
        type: 'order',
        title: 'Đơn hàng hoàn thành',
        content:
          'Đơn hàng của bạn đã được hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!',
        isRead: true,
        readAt: new Date(),
        metadata: { orderId: orders[0]._id },
      },
      {
        userId: customers[1]._id,
        canteenId: canteens[0]._id,
        type: 'order',
        title: 'Đơn hàng sẵn sàng',
        content: 'Đơn hàng của bạn đã sẵn sàng để lấy!',
        isRead: false,
        metadata: { orderId: orders[1]._id },
      },
      {
        userId: customers[0]._id,
        type: 'promotion',
        title: 'Khuyến mãi đặc biệt',
        content: 'Giảm 10% cho đơn hàng đầu tiên với mã WELCOME10',
        isRead: false,
        metadata: { voucherId: vouchers[0]._id },
      },
      {
        userId: staffUser._id,
        canteenId: canteens[0]._id,
        type: 'shift',
        title: 'Lịch làm việc mới',
        content: 'Bạn đã được phân công ca sáng ngày mai',
        isRead: true,
        readAt: new Date(),
        metadata: { shiftId: shifts[0]._id },
      },
      {
        userId: staffUser._id,
        canteenId: canteens[0]._id,
        type: 'salary',
        title: 'Lương đã được thanh toán',
        content: 'Lương tháng trước của bạn đã được thanh toán',
        isRead: false,
        metadata: { salaryId: salaries[0]._id },
      },
    ]);

    const systemNotifications = await SystemNotification.insertMany([
      {
        canteenId: canteens[0]._id,
        title: 'Thông báo bảo trì',
        content:
          'Hệ thống sẽ bảo trì từ 22:00 - 06:00 ngày mai. Xin lỗi vì sự bất tiện này.',
        targetRole: 'all',
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        title: 'Chào mừng thành viên mới',
        content:
          'Chào mừng bạn đến với UniLife Canteen! Khám phá các món ăn ngon và khuyến mãi hấp dẫn.',
        targetRole: 'customer',
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        canteenId: canteens[0]._id,
        title: 'Họp nhân viên',
        content: 'Thông báo họp nhân viên vào 8:00 sáng thứ 2 hàng tuần',
        targetRole: 'staff',
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id,
      },
    ]);
    console.log(
      `✅ Created ${notifications.length} notifications, ${systemNotifications.length} system notifications\n`
    );

    // ============ Seed Report Data ============
    console.log('📊 Creating report data...');
    const reportSnapshots = await ReportSnapshot.insertMany([
      {
        canteenId: canteens[0]._id,
        reportType: 'daily',
        reportName: 'Báo cáo ngày ' + today.toISOString().slice(0, 10),
        periodStart: new Date(today.setHours(0, 0, 0, 0)),
        periodEnd: new Date(today.setHours(23, 59, 59, 999)),
        data: {
          totalOrders: 25,
          totalRevenue: 2500000,
          averageOrderValue: 100000,
          topProducts: [
            {
              productId: products[0]._id,
              productName: products[0].name,
              quantitySold: 15,
              revenue: 525000,
            },
            {
              productId: products[2]._id,
              productName: products[2].name,
              quantitySold: 12,
              revenue: 480000,
            },
          ],
          categorySales: [
            {
              categoryId: productCategories[0]._id,
              categoryName: 'Cơm',
              totalSales: 20,
              revenue: 700000,
            },
            {
              categoryId: productCategories[1]._id,
              categoryName: 'Phở',
              totalSales: 12,
              revenue: 480000,
            },
          ],
          newCustomers: 5,
          returningCustomers: 20,
          totalFeedbacks: 8,
          averageRating: 4.5,
        },
        generatedBy: adminUser._id,
        generatedAt: new Date(),
      },
      {
        canteenId: canteens[0]._id,
        reportType: 'weekly',
        reportName: 'Báo cáo tuần',
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        data: {
          totalOrders: 150,
          totalRevenue: 15000000,
          averageOrderValue: 100000,
          topProducts: [
            {
              productId: products[0]._id,
              productName: products[0].name,
              quantitySold: 80,
              revenue: 2800000,
            },
            {
              productId: products[1]._id,
              productName: products[1].name,
              quantitySold: 65,
              revenue: 2275000,
            },
          ],
          newCustomers: 25,
          returningCustomers: 125,
          totalFeedbacks: 45,
          averageRating: 4.3,
        },
        generatedBy: adminUser._id,
        generatedAt: new Date(),
      },
    ]);

    const auditLogs = await AuditLog.insertMany([
      {
        userId: adminUser._id,
        action: 'login',
        entity: 'user',
        entityId: adminUser._id,
        description: 'Admin đăng nhập hệ thống',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      },
      {
        userId: adminUser._id,
        canteenId: canteens[0]._id,
        action: 'create',
        entity: 'product',
        entityId: products[0]._id,
        description: 'Tạo sản phẩm mới: ' + products[0].name,
        newData: { name: products[0].name, price: products[0].price },
        ipAddress: '127.0.0.1',
      },
      {
        userId: staffUser._id,
        canteenId: canteens[0]._id,
        action: 'order_status_change',
        entity: 'order',
        entityId: orders[0]._id,
        description: 'Cập nhật trạng thái đơn hàng thành completed',
        previousData: { status: 'ready' },
        newData: { status: 'completed' },
        ipAddress: '192.168.1.100',
      },
      {
        userId: adminUser._id,
        canteenId: canteens[0]._id,
        action: 'settings_change',
        entity: 'canteen',
        entityId: canteens[0]._id,
        description: 'Cập nhật giờ mở cửa căng tin',
        previousData: { openingHours: '07:00 - 19:00' },
        newData: { openingHours: '06:00 - 20:00' },
        ipAddress: '127.0.0.1',
      },
    ]);

    const shiftSummaries = await ShiftSummary.insertMany([
      {
        canteenId: canteens[0]._id,
        shiftId: shifts[0]._id,
        date: today,
        staffAssigned: [staffUser._id],
        summary: {
          totalOrders: 35,
          completedOrders: 33,
          cancelledOrders: 2,
          totalRevenue: 3500000,
          averageOrderTime: 12,
          peakHour: '11:00',
          topSellingProducts: [
            {
              productId: products[0]._id,
              productName: products[0].name,
              quantity: 20,
            },
            {
              productId: products[2]._id,
              productName: products[2].name,
              quantity: 15,
            },
          ],
        },
        notes: 'Ca làm việc bình thường',
        status: 'closed',
        reviewedBy: managerUser._id,
        reviewedAt: new Date(),
      },
      {
        canteenId: canteens[0]._id,
        shiftId: shifts[1]._id,
        date: today,
        staffAssigned: [staffUser._id],
        summary: {
          totalOrders: 45,
          completedOrders: 44,
          cancelledOrders: 1,
          totalRevenue: 4500000,
          averageOrderTime: 10,
          peakHour: '12:30',
          topSellingProducts: [
            {
              productId: products[1]._id,
              productName: products[1].name,
              quantity: 25,
            },
            {
              productId: products[3]._id,
              productName: products[3].name,
              quantity: 18,
            },
          ],
        },
        notes: 'Ca trưa đông khách',
        status: 'open',
      },
    ]);

    const pickupLogs = await PickupLog.insertMany([
      {
        orderId: orders[0]._id,
        canteenId: canteens[0]._id,
        customerId: customers[0]._id,
        staffId: staffUser._id,
        action: 'qr_generated',
        qrCode: 'QR_' + orders[0]._id.toString(),
        notes: 'QR code được tạo tự động',
      },
      {
        orderId: orders[0]._id,
        canteenId: canteens[0]._id,
        customerId: customers[0]._id,
        staffId: staffUser._id,
        action: 'qr_scanned',
        qrCode: 'QR_' + orders[0]._id.toString(),
        scannedAt: new Date(),
        notes: 'Khách hàng quét mã QR',
      },
      {
        orderId: orders[0]._id,
        canteenId: canteens[0]._id,
        customerId: customers[0]._id,
        staffId: staffUser._id,
        action: 'pickup_confirmed',
        qrCode: 'QR_' + orders[0]._id.toString(),
        scannedAt: new Date(),
        notes: 'Đơn hàng đã được giao',
      },
      {
        orderId: orders[1]._id,
        canteenId: canteens[0]._id,
        customerId: customers[1]._id,
        action: 'qr_generated',
        qrCode: 'QR_' + orders[1]._id.toString(),
        notes: 'QR code được tạo tự động',
      },
    ]);
    console.log(
      `✅ Created ${reportSnapshots.length} report snapshots, ${auditLogs.length} audit logs, ${shiftSummaries.length} shift summaries, ${pickupLogs.length} pickup logs\n`
    );

    // ============ Seed Staff Shifts ============
    console.log('👷 Creating staff shifts...');
    const staffShifts = await StaffShift.insertMany([
      {
        shiftId: shifts[0]._id,
        staffId: staffUser._id,
        canteenId: canteens[0]._id,
        date: today,
        status: 'checked_out',
        checkInTime: new Date(today.setHours(6, 5, 0)),
        checkOutTime: new Date(today.setHours(12, 10, 0)),
        actualWorkHours: 6.08,
        notes: 'Ca sáng làm việc bình thường',
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[1]._id,
        staffId: staffUser._id,
        canteenId: canteens[0]._id,
        date: today,
        status: 'checked_in',
        checkInTime: new Date(today.setHours(12, 0, 0)),
        notes: 'Ca chiều',
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[0]._id,
        staffId: staffUser._id,
        canteenId: canteens[0]._id,
        date: tomorrow,
        status: 'scheduled',
        notes: 'Ca sáng ngày mai',
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[1]._id,
        staffId: staffUser._id,
        canteenId: canteens[0]._id,
        date: tomorrow,
        status: 'scheduled',
        notes: 'Ca chiều ngày mai',
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[0]._id,
        staffId: managerUser._id,
        canteenId: canteens[0]._id,
        date: today,
        status: 'checked_out',
        checkInTime: new Date(today.setHours(6, 0, 0)),
        checkOutTime: new Date(today.setHours(12, 0, 0)),
        actualWorkHours: 6,
        notes: 'Manager giám sát ca sáng',
        assignedBy: adminUser._id,
      },
    ]);
    console.log(`✅ Created ${staffShifts.length} staff shifts\n`);

    // ============ Seed Voucher Usage ============
    console.log('🎫 Creating voucher usage records...');
    const voucherUsages = await VoucherUsage.insertMany([
      {
        voucherId: vouchers[0]._id,
        orderId: orders[0]._id,
        userId: customers[0]._id,
        discountAmount: 8000,
      },
      {
        voucherId: vouchers[1]._id,
        orderId: orders[1]._id,
        userId: customers[1]._id,
        discountAmount: 20000,
      },
    ]);

    // Update voucher usedCount
    await Voucher.updateOne(
      { _id: vouchers[0]._id },
      { $inc: { usedCount: 1 } }
    );
    await Voucher.updateOne(
      { _id: vouchers[1]._id },
      { $inc: { usedCount: 1 } }
    );
    console.log(`✅ Created ${voucherUsages.length} voucher usage records\n`);

    // ============ Seed Feedback Replies ============
    console.log('💬 Creating feedback replies...');
    const feedbackReplies = await FeedbackReply.insertMany([
      {
        feedbackId: feedbacks[0]._id,
        userId: staffUser._id,
        reply:
          'Cảm ơn bạn đã đánh giá! Chúng tôi rất vui khi bạn hài lòng với món ăn.',
      },
      {
        feedbackId: feedbacks[0]._id,
        userId: adminUser._id,
        reply: 'Cảm ơn bạn đã ủng hộ căng tin. Hẹn gặp lại bạn!',
      },
      {
        feedbackId: feedbacks[1]._id,
        userId: staffUser._id,
        reply:
          'Cảm ơn góp ý của bạn! Chúng tôi sẽ cải thiện khẩu phần ăn trong thời gian tới.',
      },
      {
        feedbackId: feedbacks[1]._id,
        userId: managerUser._id,
        reply:
          'Xin lỗi vì sự bất tiện. Chúng tôi đã ghi nhận và sẽ điều chỉnh phù hợp hơn.',
      },
    ]);
    console.log(`✅ Created ${feedbackReplies.length} feedback replies\n`);

    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${3 + customers.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Campuses: ${campuses.length}`);
    console.log(`   - Canteens: ${canteens.length}`);
    console.log(`   - Product Categories: ${productCategories.length}`);
    console.log(`   - Ingredient Categories: ${ingredientCategories.length}`);
    console.log(`   - Ingredients: ${ingredients.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Menus: ${menus.length}`);
    console.log(`   - Menu Schedules: ${menuSchedules.length}`);
    console.log(`   - Shifts: ${shifts.length}`);
    console.log(`   - Staff Shifts: ${staffShifts.length}`);
    console.log(`   - Vouchers: ${vouchers.length}`);
    console.log(`   - Voucher Usages: ${voucherUsages.length}`);
    console.log(`   - Banners: ${banners.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Carts: ${carts.length}`);
    console.log(`   - Feedbacks: ${feedbacks.length}`);
    console.log(`   - Feedback Replies: ${feedbackReplies.length}`);
    console.log(`   - Salaries: ${salaries.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - System Notifications: ${systemNotifications.length}`);
    console.log(`   - Report Snapshots: ${reportSnapshots.length}`);
    console.log(`   - Audit Logs: ${auditLogs.length}`);
    console.log(`   - Shift Summaries: ${shiftSummaries.length}`);
    console.log(`   - Pickup Logs: ${pickupLogs.length}`);
    console.log('\n🔐 Default login credentials:');
    console.log('   Admin: admin@unilife.com / 123456');
    console.log('   Manager: manager@unilife.com / 123456');
    console.log('   Staff: staff@unilife.com / 123456');
    console.log('   Customer: customer1@gmail.com / 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
