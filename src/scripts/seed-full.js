import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load bien moi truong
dotenv.config();

// Import cac model
import User from "../modules/user/user.model.js";
import {
  Role,
  Permission,
  RolePermission,
  UserRole,
} from "../modules/role/role.model.js";
import Campus from "../modules/campus/campus.model.js";
import Canteen from "../modules/canteen/canteen.model.js";
import ProductCategory from "../modules/productCategory/productCategory.model.js";
import IngredientCategory from "../modules/ingredientCategory/ingredientCategory.model.js";
import { Ingredient } from "../modules/ingredient/ingredient.model.js";
import Product from "../modules/product/product.model.js";
import Menu from "../modules/menu/menu.model.js";
import MenuSchedule from "../modules/menu/menuSchedule.model.js";
import Order from "../modules/order/order.model.js";
import { Cart } from "../modules/cart/cart.model.js";
import { Shift, StaffShift } from "../modules/shift/shift.model.js";
import { ShiftChangeRequest } from "../modules/shift/shiftChangeRequest.model.js";
import { Voucher, VoucherUsage } from "../modules/voucher/voucher.model.js";
import { Banner } from "../modules/banner/banner.model.js";
import { Feedback } from "../modules/feedback/feedback.model.js";
import { FeedbackReply } from "../modules/feedbackReply/feedbackReply.model.js";
import Salary from "../modules/salary/salary.model.js";
import Payroll from "../modules/payroll/payroll.model.js";
import SalaryRate from "../modules/salaryRate/salaryRate.model.js";
import {
  Notification,
  SystemNotification,
} from "../modules/notification/notification.model.js";
import {
  ReportSnapshot,
  AuditLog,
  ShiftSummary,
  PickupLog,
} from "../modules/report/report.model.js";
import { Wishlist } from "../modules/wishlist/wishlist.model.js";
import { Token, OTP } from "../modules/token/token.model.js";
import connectDB from "../config/db.js";

// Ket noi database va seed du lieu
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("🌱 Bat dau seed du lieu...\n");

    // Xoa du lieu cu
    console.log("🗑️  Dang xoa du lieu cu...");
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
    await ShiftChangeRequest.deleteMany({});
    await Voucher.deleteMany({});
    await VoucherUsage.deleteMany({});
    await Banner.deleteMany({});
    await Feedback.deleteMany({});
    await FeedbackReply.deleteMany({});
    await Salary.deleteMany({});
    await Payroll.deleteMany({});
    await SalaryRate.deleteMany({});
    await Notification.deleteMany({});
    await SystemNotification.deleteMany({});
    await ReportSnapshot.deleteMany({});
    await AuditLog.deleteMany({});
    await ShiftSummary.deleteMany({});
    await PickupLog.deleteMany({});
    await Wishlist.deleteMany({});
    await Token.deleteMany({});
    await OTP.deleteMany({});
    console.log("✅ Da xoa du lieu cu\n");

    // ============ Seed Campus ============
    console.log("🏫 Tao campus...");
    const campuses = await Campus.insertMany([
      {
        name: "FPT University HCMC",
        code: "HCM",
        address:
          "Lo E2a-7, Duong D1, Khu Cong nghe cao, P. Long Thanh My, TP. Thu Duc, TP. HCM",
        status: "active",
      },
      {
        name: "FPT University Hanoi",
        code: "HN",
        address:
          "Khu Giao duc va Dao tao, Khu Cong nghe cao Hoa Lac, Km29 Dai lo Thang Long, Ha Noi",
        status: "active",
      },
      {
        name: "FPT University Da Nang",
        code: "DN",
        address:
          "Khu do thi cong nghe FPT Da Nang, P. Hoa Hai, Q. Ngu Hanh Son, TP. Da Nang",
        status: "active",
      },
    ]);
    console.log(`✅ Da tao ${campuses.length} campus\n`);

    // ============ Seed Canteens ============
    console.log("🏢 Tao canteen...");
    const canteens = await Canteen.insertMany([
      {
        name: "Canteen A - Khu A",
        location: "Khu A, Tang 1",
        campusId: campuses[0]._id,
        status: "active",
      },
      {
        name: "Canteen B - Khu B",
        location: "Khu B, Tang 2",
        campusId: campuses[0]._id,
        status: "active",
      },
      {
        name: "Canteen C - Ha Noi",
        location: "Khu C, Tang 1",
        campusId: campuses[1]._id,
        status: "active",
      },
      {
        name: "Canteen D - Da Nang",
        location: "Khu D, Tang 1",
        campusId: campuses[2]._id,
        status: "active",
      },
    ]);
    console.log(`✅ Da tao ${canteens.length} canteen\n`);

    // ============ Seed Users ============
    console.log("👤 Tao nguoi dung...");
    const hashedPassword = await bcrypt.hash("123456", 12);

    const adminUser = await User.create({
      email: "admin@unilife.com",
      password: hashedPassword,
      fullName: "Admin UniLife",
      phone: "0123456789",
      gender: "male",
      role: "admin",
      status: "active",
      emailVerified: true,
      campusId: campuses[0]._id,
    });

    const managerUser = await User.create({
      email: "manager@unilife.com",
      password: hashedPassword,
      fullName: "Nguyen Van Manager",
      phone: "0123456788",
      gender: "male",
      role: "canteen_owner",
      status: "active",
      emailVerified: true,
      campusId: campuses[0]._id,
      canteenId: canteens[0]._id,
    });

    const staffUsers = await User.insertMany([
      {
        email: "staff1@unilife.com",
        password: hashedPassword,
        fullName: "Tran Thi Staff 1",
        phone: "0123456787",
        gender: "female",
        role: "staff",
        status: "active",
        emailVerified: true,
        campusId: campuses[0]._id,
        canteenId: canteens[0]._id,
      },
      {
        email: "staff2@unilife.com",
        password: hashedPassword,
        fullName: "Le Van Staff 2",
        phone: "0123456786",
        gender: "male",
        role: "staff",
        status: "active",
        emailVerified: true,
        campusId: campuses[0]._id,
        canteenId: canteens[0]._id,
      },
      {
        email: "staff3@unilife.com",
        password: hashedPassword,
        fullName: "Pham Thi Staff 3",
        phone: "0123456785",
        gender: "female",
        role: "staff",
        status: "active",
        emailVerified: true,
        campusId: campuses[0]._id,
        canteenId: canteens[1]._id,
      },
    ]);

    const customers = await User.insertMany([
      {
        email: "customer1@gmail.com",
        password: hashedPassword,
        fullName: "Nguyen Van A",
        phone: "0987654321",
        gender: "male",
        role: "customer",
        status: "active",
        balance: 500000,
        emailVerified: true,
        campusId: campuses[0]._id,
      },
      {
        email: "customer2@gmail.com",
        password: hashedPassword,
        fullName: "Tran Thi B",
        phone: "0987654322",
        gender: "female",
        role: "customer",
        status: "active",
        balance: 300000,
        emailVerified: true,
        campusId: campuses[0]._id,
      },
      {
        email: "customer3@gmail.com",
        password: hashedPassword,
        fullName: "Le Van C",
        phone: "0987654323",
        gender: "male",
        role: "customer",
        status: "active",
        balance: 200000,
        emailVerified: true,
        campusId: campuses[0]._id,
      },
      {
        email: "customer4@gmail.com",
        password: hashedPassword,
        fullName: "Hoang Thi D",
        phone: "0987654324",
        gender: "female",
        role: "customer",
        status: "active",
        balance: 150000,
        emailVerified: true,
        campusId: campuses[1]._id,
      },
      {
        email: "customer5@gmail.com",
        password: hashedPassword,
        fullName: "Vo Van E",
        phone: "0987654325",
        gender: "male",
        role: "customer",
        status: "active",
        balance: 100000,
        emailVerified: true,
        campusId: campuses[2]._id,
      },
    ]);

    console.log(
      `✅ Da tao ${4 + staffUsers.length + customers.length} nguoi dung\n`,
    );

    // ============ Seed Roles & Permissions ============
    console.log("🔐 Tao roles va permissions...");
    const roles = await Role.insertMany([
      { roleName: "admin", description: "Quan tri vien he thong" },
      { roleName: "staff", description: "Nhan vien cang tin" },
      { roleName: "customer", description: "Khach hang" },
    ]);

    const permissions = await Permission.insertMany([
      { code: "USER_READ", description: "Xem thong tin nguoi dung" },
      { code: "USER_CREATE", description: "Tao nguoi dung moi" },
      { code: "USER_UPDATE", description: "Cap nhat thong tin nguoi dung" },
      { code: "USER_DELETE", description: "Xoa nguoi dung" },
      { code: "PRODUCT_READ", description: "Xem san pham" },
      { code: "PRODUCT_CREATE", description: "Tao san pham moi" },
      { code: "PRODUCT_UPDATE", description: "Cap nhat san pham" },
      { code: "PRODUCT_DELETE", description: "Xoa san pham" },
      { code: "PRODUCT_CATEGORY_READ", description: "Xem danh muc san pham" },
      { code: "PRODUCT_CATEGORY_CREATE", description: "Tao danh muc san pham" },
      {
        code: "PRODUCT_CATEGORY_UPDATE",
        description: "Cap nhat danh muc san pham",
      },
      { code: "PRODUCT_CATEGORY_DELETE", description: "Xoa danh muc san pham" },
      { code: "ORDER_READ", description: "Xem don hang" },
      { code: "ORDER_CREATE", description: "Tao don hang" },
      { code: "ORDER_UPDATE", description: "Cap nhat don hang" },
      { code: "ORDER_DELETE", description: "Xoa don hang" },
      { code: "REPORT_READ", description: "Xem bao cao" },
      { code: "REPORT_EXPORT", description: "Xuat bao cao" },
      { code: "SHIFT_MANAGE", description: "Quan ly ca lam viec" },
      { code: "SALARY_MANAGE", description: "Quan ly luong" },
      { code: "MENU_MANAGE", description: "Quan ly menu" },
      { code: "VOUCHER_MANAGE", description: "Quan ly voucher" },
      { code: "BANNER_MANAGE", description: "Quan ly banner" },
      { code: "INGREDIENT_MANAGE", description: "Quan ly nguyen lieu" },
    ]);

    // Gan quyen cho role
    const adminRole = roles.find((r) => r.roleName === "admin");
    const staffRole = roles.find((r) => r.roleName === "staff");
    const customerRole = roles.find((r) => r.roleName === "customer");

    const rolePermissions = await RolePermission.insertMany([
      // Admin co tat ca quyen
      ...permissions.map((p) => ({
        roleId: adminRole._id,
        permissionId: p._id,
      })),
      // Staff co quyen san pham, order
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === "PRODUCT_READ")._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === "PRODUCT_UPDATE")._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find(
          (p) => p.code === "PRODUCT_CATEGORY_READ",
        )._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === "ORDER_READ")._id,
      },
      {
        roleId: staffRole._id,
        permissionId: permissions.find((p) => p.code === "ORDER_UPDATE")._id,
      },
      // Customer co quyen co ban
      {
        roleId: customerRole._id,
        permissionId: permissions.find((p) => p.code === "PRODUCT_READ")._id,
      },
      {
        roleId: customerRole._id,
        permissionId: permissions.find(
          (p) => p.code === "PRODUCT_CATEGORY_READ",
        )._id,
      },
      {
        roleId: customerRole._id,
        permissionId: permissions.find((p) => p.code === "ORDER_READ")._id,
      },
      {
        roleId: customerRole._id,
        permissionId: permissions.find((p) => p.code === "ORDER_CREATE")._id,
      },
    ]);

    // Gan role cho user
    const userRoles = await UserRole.insertMany([
      { userId: adminUser._id, roleId: adminRole._id },
      { userId: managerUser._id, roleId: adminRole._id },
      { userId: staffUsers[0]._id, roleId: staffRole._id },
      { userId: staffUsers[1]._id, roleId: staffRole._id },
      { userId: staffUsers[2]._id, roleId: staffRole._id },
      { userId: customers[0]._id, roleId: customerRole._id },
      { userId: customers[1]._id, roleId: customerRole._id },
      { userId: customers[2]._id, roleId: customerRole._id },
      { userId: customers[3]._id, roleId: customerRole._id },
      { userId: customers[4]._id, roleId: customerRole._id },
    ]);
    console.log(
      `✅ Da tao ${roles.length} roles, ${permissions.length} permissions\n`,
    );

    // ============ Seed Product Categories ============
    console.log("📂 Tao danh muc san pham...");
    const productCategories = await ProductCategory.insertMany([
      {
        canteenId: canteens[0]._id,
        name: "Com",
        description: "Cac mon com",
        icon: "rice",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Pho",
        description: "Cac mon pho",
        icon: "noodle",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Bun",
        description: "Cac mon bun",
        icon: "vermicelli",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Mi",
        description: "Cac mon mi",
        icon: "pasta",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Do uong",
        description: "Nuoc giai khat",
        icon: "drink",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Trang mieng",
        description: "Mon trang mieng",
        icon: "dessert",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "An vat",
        description: "Do an vat",
        icon: "snack",
        isActive: true,
      },
      // Danh muc cho canteen khac
      {
        canteenId: canteens[1]._id,
        name: "Com",
        description: "Cac mon com",
        icon: "rice",
        isActive: true,
      },
      {
        canteenId: canteens[1]._id,
        name: "Pho",
        description: "Cac mon pho",
        icon: "noodle",
        isActive: true,
      },
      {
        canteenId: canteens[1]._id,
        name: "Do uong",
        description: "Nuoc giai khat",
        icon: "drink",
        isActive: true,
      },
    ]);
    console.log(`✅ Da tao ${productCategories.length} danh muc san pham\n`);

    // ============ Seed Ingredient Categories ============
    console.log("📂 Tao danh muc nguyen lieu...");
    const ingredientCategories = await IngredientCategory.insertMany([
      {
        canteenId: canteens[0]._id,
        name: "Thit",
        description: "Cac loai thit",
        icon: "meat",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Rau cu",
        description: "Rau va cu qua",
        icon: "vegetable",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Gia vi",
        description: "Gia vi nau an",
        icon: "spice",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Nguyen lieu kho",
        description: "Gao, bun, mi",
        icon: "grain",
        isActive: true,
      },
      {
        canteenId: canteens[0]._id,
        name: "Do dong lanh",
        description: "Thuc pham dong lanh",
        icon: "frozen",
        isActive: true,
      },
      // Danh muc cho canteen khac
      {
        canteenId: canteens[1]._id,
        name: "Thit",
        description: "Cac loai thit",
        icon: "meat",
        isActive: true,
      },
      {
        canteenId: canteens[1]._id,
        name: "Rau cu",
        description: "Rau va cu qua",
        icon: "vegetable",
        isActive: true,
      },
      {
        canteenId: canteens[1]._id,
        name: "Nguyen lieu kho",
        description: "Gao, bun, mi",
        icon: "grain",
        isActive: true,
      },
    ]);
    console.log(
      `✅ Da tao ${ingredientCategories.length} danh muc nguyen lieu\n`,
    );

    // ============ Seed Ingredients ============
    console.log("🥬 Tao nguyen lieu...");
    const ingredients = await Ingredient.insertMany([
      {
        canteenId: canteens[0]._id,
        name: "Gao",
        categoryId: ingredientCategories[3]._id,
        unit: "kg",
        stock: 500,
      },
      {
        canteenId: canteens[0]._id,
        name: "Thit heo",
        categoryId: ingredientCategories[0]._id,
        unit: "kg",
        stock: 50,
      },
      {
        canteenId: canteens[0]._id,
        name: "Thit ga",
        categoryId: ingredientCategories[0]._id,
        unit: "kg",
        stock: 40,
      },
      {
        canteenId: canteens[0]._id,
        name: "Thit bo",
        categoryId: ingredientCategories[0]._id,
        unit: "kg",
        stock: 30,
      },
      {
        canteenId: canteens[0]._id,
        name: "Ca chua",
        categoryId: ingredientCategories[1]._id,
        unit: "kg",
        stock: 30,
      },
      {
        canteenId: canteens[0]._id,
        name: "Rau xa lach",
        categoryId: ingredientCategories[1]._id,
        unit: "kg",
        stock: 20,
      },
      {
        canteenId: canteens[0]._id,
        name: "Hanh la",
        categoryId: ingredientCategories[1]._id,
        unit: "kg",
        stock: 15,
      },
      {
        canteenId: canteens[0]._id,
        name: "Dau an",
        categoryId: ingredientCategories[2]._id,
        unit: "lit",
        stock: 100,
      },
      {
        canteenId: canteens[0]._id,
        name: "Nuoc mam",
        categoryId: ingredientCategories[2]._id,
        unit: "lit",
        stock: 50,
      },
      {
        canteenId: canteens[0]._id,
        name: "Muoi",
        categoryId: ingredientCategories[2]._id,
        unit: "kg",
        stock: 30,
      },
      {
        canteenId: canteens[0]._id,
        name: "Duong",
        categoryId: ingredientCategories[2]._id,
        unit: "kg",
        stock: 25,
      },
      {
        canteenId: canteens[0]._id,
        name: "Pho kho",
        categoryId: ingredientCategories[3]._id,
        unit: "kg",
        stock: 100,
      },
      {
        canteenId: canteens[0]._id,
        name: "Bun tuoi",
        categoryId: ingredientCategories[3]._id,
        unit: "kg",
        stock: 80,
      },
      {
        canteenId: canteens[0]._id,
        name: "Mi soi",
        categoryId: ingredientCategories[3]._id,
        unit: "kg",
        stock: 60,
      },
      {
        canteenId: canteens[0]._id,
        name: "Trung ga",
        categoryId: ingredientCategories[4]._id,
        unit: "qua",
        stock: 200,
      },
      // Nguyen lieu cho canteen khac
      {
        canteenId: canteens[1]._id,
        name: "Gao",
        categoryId: ingredientCategories[7]._id,
        unit: "kg",
        stock: 300,
      },
      {
        canteenId: canteens[1]._id,
        name: "Thit heo",
        categoryId: ingredientCategories[5]._id,
        unit: "kg",
        stock: 40,
      },
      {
        canteenId: canteens[1]._id,
        name: "Rau xa lach",
        categoryId: ingredientCategories[6]._id,
        unit: "kg",
        stock: 25,
      },
    ]);
    console.log(`✅ Da tao ${ingredients.length} nguyen lieu\n`);

    // ============ Seed Products ============
    console.log("🍽️  Tao san pham...");
    const products = await Product.insertMany([
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[0]._id,
        name: "Com suon nuong",
        slug: "com-suon-nuong",
        price: 35000,
        originalPrice: 40000,
        status: "available",
        description: "Com suon nuong thom ngon, an kem rau xao",
        image:
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
        calories: 650,
        preparationTime: 15,
        isPopular: true,
        stockQuantity: 50,
        recipe: [
          {
            ingredientId: ingredients[0]._id,
            ingredientName: "Gao",
            quantity: 0.2,
            unit: "kg",
          },
          {
            ingredientId: ingredients[1]._id,
            ingredientName: "Thit heo",
            quantity: 0.15,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[0]._id,
        name: "Com ga chien nuoc mam",
        slug: "com-ga-chien-nuoc-mam",
        price: 35000,
        status: "available",
        description: "Com ga chien nuoc mam gion rum, dam da",
        image:
          "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400",
        calories: 600,
        preparationTime: 15,
        isPopular: true,
        stockQuantity: 50,
        recipe: [
          {
            ingredientId: ingredients[0]._id,
            ingredientName: "Gao",
            quantity: 0.2,
            unit: "kg",
          },
          {
            ingredientId: ingredients[2]._id,
            ingredientName: "Thit ga",
            quantity: 0.15,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[0]._id,
        name: "Com tam suon bi cha",
        slug: "com-tam-suon-bi-cha",
        price: 40000,
        status: "available",
        description: "Com tam Sai Gon truyen thong voi suon, bi, cha",
        image:
          "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400",
        calories: 700,
        preparationTime: 18,
        isPopular: true,
        stockQuantity: 40,
        recipe: [
          {
            ingredientId: ingredients[0]._id,
            ingredientName: "Gao",
            quantity: 0.25,
            unit: "kg",
          },
          {
            ingredientId: ingredients[1]._id,
            ingredientName: "Thit heo",
            quantity: 0.2,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[1]._id,
        name: "Pho bo tai",
        slug: "pho-bo-tai",
        price: 45000,
        status: "available",
        description: "Pho bo Ha Noi truyen thong, thit bo tai mem ngon",
        image:
          "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
        calories: 500,
        preparationTime: 20,
        isPopular: true,
        stockQuantity: 30,
        recipe: [
          {
            ingredientId: ingredients[11]._id,
            ingredientName: "Pho kho",
            quantity: 0.3,
            unit: "kg",
          },
          {
            ingredientId: ingredients[3]._id,
            ingredientName: "Thit bo",
            quantity: 0.1,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[1]._id,
        name: "Pho ga",
        slug: "pho-ga",
        price: 40000,
        status: "available",
        description: "Pho ga nuoc dung trong thanh",
        image:
          "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=400",
        calories: 450,
        preparationTime: 18,
        stockQuantity: 35,
        recipe: [
          {
            ingredientId: ingredients[11]._id,
            ingredientName: "Pho kho",
            quantity: 0.3,
            unit: "kg",
          },
          {
            ingredientId: ingredients[2]._id,
            ingredientName: "Thit ga",
            quantity: 0.1,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[2]._id,
        name: "Bun cha Ha Noi",
        slug: "bun-cha-ha-noi",
        price: 35000,
        status: "available",
        description: "Bun cha Ha Noi chinh hieu",
        image:
          "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400",
        calories: 550,
        preparationTime: 15,
        stockQuantity: 40,
        recipe: [
          {
            ingredientId: ingredients[12]._id,
            ingredientName: "Bun tuoi",
            quantity: 0.3,
            unit: "kg",
          },
          {
            ingredientId: ingredients[1]._id,
            ingredientName: "Thit heo",
            quantity: 0.15,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[2]._id,
        name: "Bun bo Hue",
        slug: "bun-bo-hue",
        price: 45000,
        status: "available",
        description: "Bun bo Hue cay nong, dam vi",
        image:
          "https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400",
        calories: 600,
        preparationTime: 20,
        isNew: true,
        stockQuantity: 25,
        recipe: [
          {
            ingredientId: ingredients[12]._id,
            ingredientName: "Bun tuoi",
            quantity: 0.3,
            unit: "kg",
          },
          {
            ingredientId: ingredients[3]._id,
            ingredientName: "Thit bo",
            quantity: 0.12,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[3]._id,
        name: "Mi Y sot bo bam",
        slug: "mi-y-sot-bo-bam",
        price: 50000,
        status: "available",
        description: "Mi Y kieu Au voi sot bo bam dam da",
        image:
          "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400",
        calories: 580,
        preparationTime: 20,
        isNew: true,
        stockQuantity: 30,
        recipe: [
          {
            ingredientId: ingredients[13]._id,
            ingredientName: "Mi soi",
            quantity: 0.25,
            unit: "kg",
          },
          {
            ingredientId: ingredients[3]._id,
            ingredientName: "Thit bo",
            quantity: 0.1,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[4]._id,
        name: "Tra da",
        slug: "tra-da",
        price: 5000,
        status: "available",
        description: "Tra da mat lanh",
        image:
          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
        preparationTime: 2,
        stockQuantity: 100,
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[4]._id,
        name: "Coca Cola",
        slug: "coca-cola",
        price: 15000,
        status: "available",
        description: "Coca Cola lon 330ml",
        image:
          "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400",
        stockQuantity: 100,
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[4]._id,
        name: "Nuoc cam ep",
        slug: "nuoc-cam-ep",
        price: 25000,
        status: "available",
        description: "Nuoc cam tuoi ep nguyen chat",
        image:
          "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400",
        preparationTime: 5,
        stockQuantity: 50,
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[5]._id,
        name: "Che thai",
        slug: "che-thai",
        price: 20000,
        status: "available",
        description: "Che thai thap cam mat lanh",
        image:
          "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
        preparationTime: 5,
        stockQuantity: 30,
      },
      {
        canteenId: canteens[0]._id,
        categoryId: productCategories[6]._id,
        name: "Banh trang tron",
        slug: "banh-trang-tron",
        price: 20000,
        status: "available",
        description: "Banh trang tron Sai Gon vi cay",
        image:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
        preparationTime: 8,
        isPopular: true,
        stockQuantity: 40,
      },
      // San pham cho canteen khac
      {
        canteenId: canteens[1]._id,
        categoryId: productCategories[7]._id,
        name: "Com suon xao chua ngot",
        slug: "com-suon-xao-chua-ngot",
        price: 38000,
        status: "available",
        description: "Com suon xao chua ngot kieu Bac",
        image:
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
        calories: 620,
        preparationTime: 15,
        stockQuantity: 45,
        recipe: [
          {
            ingredientId: ingredients[15]._id,
            ingredientName: "Gao",
            quantity: 0.2,
            unit: "kg",
          },
          {
            ingredientId: ingredients[16]._id,
            ingredientName: "Thit heo",
            quantity: 0.15,
            unit: "kg",
          },
        ],
      },
      {
        canteenId: canteens[1]._id,
        categoryId: productCategories[8]._id,
        name: "Pho bo chin",
        slug: "pho-bo-chin",
        price: 42000,
        status: "available",
        description: "Pho bo voi thit chin mem",
        image:
          "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
        calories: 520,
        preparationTime: 18,
        stockQuantity: 30,
      },
    ]);
    console.log(`✅ Da tao ${products.length} san pham\n`);

    // ============ Seed Menus ============
    console.log("📋 Tao menu...");
    const menus = await Menu.insertMany([
      {
        canteenId: canteens[0]._id,
        name: "Menu sang",
        status: "active",
        items: [
          { productId: products[3]._id, order: 1 },
          { productId: products[4]._id, order: 2 },
          { productId: products[8]._id, order: 3 },
        ],
      },
      {
        canteenId: canteens[0]._id,
        name: "Menu trua",
        status: "active",
        items: [
          { productId: products[0]._id, order: 1 },
          { productId: products[1]._id, order: 2 },
          { productId: products[2]._id, order: 3 },
          { productId: products[5]._id, order: 4 },
          { productId: products[6]._id, order: 5 },
          { productId: products[8]._id, order: 6 },
          { productId: products[9]._id, order: 7 },
        ],
      },
      {
        canteenId: canteens[0]._id,
        name: "Menu chieu",
        status: "active",
        items: [
          { productId: products[0]._id, order: 1 },
          { productId: products[2]._id, order: 2 },
          { productId: products[7]._id, order: 3 },
          { productId: products[11]._id, order: 4 },
          { productId: products[12]._id, order: 5 },
        ],
      },
      {
        canteenId: canteens[0]._id,
        name: "Menu dac biet cuoi tuan",
        status: "draft",
        items: [
          { productId: products[2]._id, order: 1 },
          { productId: products[3]._id, order: 2 },
          { productId: products[6]._id, order: 3 },
          { productId: products[7]._id, order: 4 },
        ],
      },
      {
        canteenId: canteens[1]._id,
        name: "Menu chinh",
        status: "active",
        items: [
          { productId: products[13]._id, order: 1 },
          { productId: products[14]._id, order: 2 },
        ],
      },
    ]);
    console.log(`✅ Da tao ${menus.length} menu\n`);

    // ============ Seed Menu Schedules ============
    console.log("📅 Tao lich menu...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const menuSchedules = await MenuSchedule.insertMany([
      {
        menuId: menus[0]._id,
        canteenId: canteens[0]._id,
        startAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          6,
          0,
        ),
        endAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          10,
          30,
        ),
        status: "enabled",
      },
      {
        menuId: menus[1]._id,
        canteenId: canteens[0]._id,
        startAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          10,
          30,
        ),
        endAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          14,
          0,
        ),
        status: "enabled",
      },
      {
        menuId: menus[2]._id,
        canteenId: canteens[0]._id,
        startAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          14,
          0,
        ),
        endAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          18,
          0,
        ),
        status: "enabled",
      },
      {
        menuId: menus[4]._id,
        canteenId: canteens[1]._id,
        startAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          7,
          0,
        ),
        endAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          19,
          0,
        ),
        status: "enabled",
      },
    ]);
    console.log(`✅ Da tao ${menuSchedules.length} lich menu\n`);

    // ============ Seed Shifts ============
    console.log("⏰ Tao ca lam viec...");
    const shifts = await Shift.insertMany([
      {
        canteenId: canteens[0]._id,
        name: "Ca Sang",
        startTime: "06:00",
        endTime: "12:00",
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        maxStaff: 5,
        status: "active",
      },
      {
        canteenId: canteens[0]._id,
        name: "Ca Chieu",
        startTime: "12:00",
        endTime: "18:00",
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        maxStaff: 5,
        status: "active",
      },
      {
        canteenId: canteens[0]._id,
        name: "Ca Toi",
        startTime: "18:00",
        endTime: "22:00",
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        maxStaff: 3,
        status: "active",
      },
      {
        canteenId: canteens[1]._id,
        name: "Ca Sang",
        startTime: "07:00",
        endTime: "13:00",
        dayOfWeek: [1, 2, 3, 4, 5],
        maxStaff: 4,
        status: "active",
      },
      {
        canteenId: canteens[1]._id,
        name: "Ca Chieu",
        startTime: "13:00",
        endTime: "19:00",
        dayOfWeek: [1, 2, 3, 4, 5],
        maxStaff: 4,
        status: "active",
      },
    ]);
    console.log(`✅ Da tao ${shifts.length} ca lam viec\n`);

    // ============ Seed Staff Shifts ============
    console.log("👷 Phan cong ca lam viec...");
    const staffShifts = await StaffShift.insertMany([
      {
        shiftId: shifts[0]._id,
        staffId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        date: today,
        status: "checked_out",
        publishedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        checkInTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          6,
          5,
        ),
        checkOutTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          12,
          10,
        ),
        actualWorkHours: 6.08,
        notes: "Ca sang lam viec binh thuong",
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[1]._id,
        staffId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        date: today,
        status: "checked_in",
        publishedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        checkInTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          12,
          0,
        ),
        notes: "Ca chieu",
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[0]._id,
        staffId: staffUsers[1]._id,
        canteenId: canteens[0]._id,
        date: today,
        status: "checked_out",
        publishedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        checkInTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          6,
          0,
        ),
        checkOutTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          12,
          0,
        ),
        actualWorkHours: 6,
        notes: "Ca sang",
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[0]._id,
        staffId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        date: tomorrow,
        status: "scheduled",
        publishedAt: new Date(),
        notes: "Ca sang ngay mai",
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[1]._id,
        staffId: staffUsers[1]._id,
        canteenId: canteens[0]._id,
        date: tomorrow,
        status: "scheduled",
        publishedAt: new Date(),
        notes: "Ca chieu ngay mai",
        assignedBy: managerUser._id,
      },
      {
        shiftId: shifts[0]._id,
        staffId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        date: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        status: "scheduled",
        notes: "Ca sang - chua xuat ban",
        assignedBy: managerUser._id,
      },
    ]);
    console.log(`✅ Da phan cong ${staffShifts.length} ca lam viec\n`);

    // ============ Seed Shift Change Requests ============
    console.log("📝 Tao yeu cau doi ca...");
    const shiftChangeRequests = await ShiftChangeRequest.insertMany([
      {
        staffShiftId: staffShifts[3]._id,
        staffId: staffUsers[0]._id,
        requestedShiftId: shifts[1]._id,
        reason: "Co viec gia dinh vao buoi sang, xin doi sang ca chieu",
        status: "pending",
      },
      {
        staffShiftId: staffShifts[4]._id,
        staffId: staffUsers[1]._id,
        requestedShiftId: shifts[0]._id,
        reason: "Muon doi sang ca sang de co thoi gian hoc toi",
        status: "approved",
        reviewedBy: managerUser._id,
        reviewedAt: new Date(),
      },
    ]);
    console.log(`✅ Da tao ${shiftChangeRequests.length} yeu cau doi ca\n`);

    // ============ Seed Vouchers ============
    console.log("🎟️  Tao voucher...");
    const vouchers = await Voucher.insertMany([
      {
        code: "WELCOME10",
        description: "Giam 10% cho don hang dau tien",
        discountType: "percentage",
        value: 10,
        maxDiscount: 50000,
        minOrderAmount: 100000,
        maxUsage: 100,
        usedCount: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        userUsageLimit: 1,
      },
      {
        code: "FREESHIP",
        description: "Mien phi ship cho don tu 200k",
        discountType: "fixed",
        value: 20000,
        minOrderAmount: 200000,
        maxUsage: 50,
        usedCount: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
        userUsageLimit: 3,
      },
      {
        code: "LUNCH50",
        description: "Giam 50k cho don hang bua trua",
        discountType: "fixed",
        value: 50000,
        minOrderAmount: 150000,
        maxUsage: 30,
        usedCount: 8,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        userUsageLimit: 2,
      },
      {
        code: "GIAM20",
        description: "Giam 20% toi da 100k",
        discountType: "percentage",
        value: 20,
        maxDiscount: 100000,
        minOrderAmount: 200000,
        maxUsage: 200,
        usedCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        userUsageLimit: 5,
      },
      {
        code: "HCMONLY",
        description: "Giam 30k chi ap dung tai HCM",
        discountType: "fixed",
        value: 30000,
        minOrderAmount: 100000,
        maxUsage: 100,
        usedCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        campusId: campuses[0]._id,
        userUsageLimit: 2,
      },
    ]);
    console.log(`✅ Da tao ${vouchers.length} voucher\n`);

    // ============ Seed Banners ============
    console.log("🎨 Tao banner...");
    const banners = await Banner.insertMany([
      {
        canteenId: canteens[0]._id,
        title: "Khuyen mai dac biet",
        imageUrl:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920",
        linkUrl: "/promotions",
        order: 1,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        canteenId: canteens[0]._id,
        title: "Menu moi tuan nay",
        imageUrl:
          "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920",
        linkUrl: "/menu",
        order: 2,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        canteenId: canteens[0]._id,
        title: "Mua he soi dong - Giam gia do uong",
        imageUrl:
          "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1920",
        linkUrl: "/drinks",
        order: 3,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        title: "Chao mung sinh vien moi",
        imageUrl:
          "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1920",
        linkUrl: "/welcome",
        order: 1,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
    ]);
    console.log(`✅ Da tao ${banners.length} banner\n`);

    // ============ Seed Orders ============
    console.log("🛒 Tao don hang...");
    const order1 = await Order.create({
      userId: customers[0]._id,
      canteenId: canteens[0]._id,
      staffId: staffUsers[0]._id,
      status: "completed",
      subTotal: 80000,
      discount: 8000,
      totalAmount: 72000,
      voucherId: vouchers[0]._id,
      voucherCode: "WELCOME10",
      items: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          quantity: 1,
          price: 35000,
        },
        {
          productId: products[3]._id,
          productName: products[3].name,
          quantity: 1,
          price: 45000,
        },
      ],
      payment: {
        method: "balance",
        status: "completed",
        paidAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        amount: 72000,
      },
      note: "Khong hanh",
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    });

    const order2 = await Order.create({
      userId: customers[1]._id,
      canteenId: canteens[0]._id,
      staffId: staffUsers[0]._id,
      status: "ready",
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
        method: "momo",
        status: "completed",
        transactionId: "MOMO123456789",
        paidAt: new Date(Date.now() - 30 * 60 * 1000),
        amount: 70000,
      },
      preparedAt: new Date(Date.now() - 10 * 60 * 1000),
    });

    const order3 = await Order.create({
      userId: customers[2]._id,
      canteenId: canteens[0]._id,
      status: "preparing",
      subTotal: 95000,
      discount: 0,
      totalAmount: 95000,
      items: [
        {
          productId: products[2]._id,
          productName: products[2].name,
          quantity: 1,
          price: 40000,
        },
        {
          productId: products[6]._id,
          productName: products[6].name,
          quantity: 1,
          price: 45000,
        },
        {
          productId: products[8]._id,
          productName: products[8].name,
          quantity: 2,
          price: 5000,
        },
      ],
      payment: {
        method: "vnpay",
        status: "completed",
        transactionId: "VNPAY987654321",
        paidAt: new Date(Date.now() - 15 * 60 * 1000),
        amount: 95000,
      },
    });

    const order4 = await Order.create({
      userId: customers[0]._id,
      canteenId: canteens[0]._id,
      status: "confirmed",
      subTotal: 55000,
      discount: 0,
      totalAmount: 55000,
      items: [
        {
          productId: products[4]._id,
          productName: products[4].name,
          quantity: 1,
          price: 40000,
        },
        {
          productId: products[9]._id,
          productName: products[9].name,
          quantity: 1,
          price: 15000,
        },
      ],
      payment: {
        method: "balance",
        status: "completed",
        paidAt: new Date(),
        amount: 55000,
      },
    });

    const order5 = await Order.create({
      userId: customers[3]._id,
      canteenId: canteens[1]._id,
      status: "completed",
      subTotal: 80000,
      discount: 0,
      totalAmount: 80000,
      items: [
        {
          productId: products[13]._id,
          productName: products[13].name,
          quantity: 1,
          price: 38000,
        },
        {
          productId: products[14]._id,
          productName: products[14].name,
          quantity: 1,
          price: 42000,
        },
      ],
      payment: {
        method: "cash",
        status: "completed",
        paidAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        amount: 80000,
      },
      completedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    });

    const order6 = await Order.create({
      userId: customers[1]._id,
      canteenId: canteens[0]._id,
      status: "cancelled",
      subTotal: 50000,
      discount: 0,
      totalAmount: 50000,
      items: [
        {
          productId: products[7]._id,
          productName: products[7].name,
          quantity: 1,
          price: 50000,
        },
      ],
      payment: {
        method: "balance",
        status: "refunded",
        amount: 50000,
        refundAmount: 50000,
        refundedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      cancelledAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      cancelReason: "Khach hang doi y",
    });

    const orders = [order1, order2, order3, order4, order5, order6];
    console.log(`✅ Da tao ${orders.length} don hang\n`);

    // ============ Seed Voucher Usages ============
    console.log("🎫 Tao lich su su dung voucher...");
    const voucherUsages = await VoucherUsage.insertMany([
      {
        voucherId: vouchers[0]._id,
        orderId: order1._id,
        userId: customers[0]._id,
        discountAmount: 8000,
      },
    ]);
    console.log(`✅ Da tao ${voucherUsages.length} lich su su dung voucher\n`);

    // ============ Seed Carts ============
    console.log("🛒 Tao gio hang...");
    const carts = await Cart.insertMany([
      {
        userId: customers[0]._id,
        canteenId: canteens[0]._id,
        items: [
          { productId: products[0]._id, quantity: 2 },
          { productId: products[8]._id, quantity: 1 },
        ],
        totalPrice: 75000,
      },
      {
        userId: customers[2]._id,
        canteenId: canteens[0]._id,
        items: [
          { productId: products[5]._id, quantity: 1 },
          { productId: products[10]._id, quantity: 2 },
        ],
        totalPrice: 85000,
      },
      {
        userId: customers[4]._id,
        canteenId: canteens[1]._id,
        items: [{ productId: products[13]._id, quantity: 1 }],
        totalPrice: 38000,
      },
    ]);
    console.log(`✅ Da tao ${carts.length} gio hang\n`);

    // ============ Seed Wishlists ============
    console.log("❤️ Tao danh sach yeu thich...");
    const wishlists = await Wishlist.insertMany([
      {
        userId: customers[0]._id,
        items: [
          { productId: products[0]._id },
          { productId: products[3]._id },
          { productId: products[6]._id },
        ],
      },
      {
        userId: customers[1]._id,
        items: [{ productId: products[1]._id }, { productId: products[4]._id }],
      },
      {
        userId: customers[2]._id,
        items: [{ productId: products[7]._id }],
      },
    ]);
    console.log(`✅ Da tao ${wishlists.length} danh sach yeu thich\n`);

    // ============ Seed Feedbacks ============
    console.log("💬 Tao danh gia...");
    const feedbacks = await Feedback.insertMany([
      {
        userId: customers[0]._id,
        orderId: order1._id,
        productId: products[0]._id,
        rating: 5,
        comment: "Rat ngon, phuc vu nhanh!",
      },
      {
        userId: customers[1]._id,
        orderId: order2._id,
        productId: products[1]._id,
        rating: 4,
        comment: "Com ga ngon, nhung hoi it",
      },
      {
        userId: customers[2]._id,
        orderId: order3._id,
        productId: products[3]._id,
        rating: 4,
        comment: "Pho ngon, nuoc dung dam da",
      },
      {
        userId: customers[3]._id,
        orderId: order5._id,
        productId: products[13]._id,
        rating: 5,
        comment: "Suon xao chua ngot ngon tuyet voi!",
      },
    ]);
    console.log(`✅ Da tao ${feedbacks.length} danh gia\n`);

    // ============ Seed Feedback Replies ============
    console.log("💬 Tao phan hoi danh gia...");
    const feedbackReplies = await FeedbackReply.insertMany([
      {
        feedbackId: feedbacks[0]._id,
        userId: staffUsers[0]._id,
        reply:
          "Cam on ban da danh gia! Chung toi rat vui khi ban hai long voi mon an.",
      },
      {
        feedbackId: feedbacks[0]._id,
        userId: adminUser._id,
        reply: "Cam on ban da ung ho cang tin. Hen gap lai ban!",
      },
      {
        feedbackId: feedbacks[2]._id,
        userId: staffUsers[0]._id,
        reply:
          "Cam on gop y cua ban! Chung toi se cai thien khau phan an trong thoi gian toi.",
      },
      {
        feedbackId: feedbacks[2]._id,
        userId: managerUser._id,
        reply:
          "Xin loi vi su bat tien. Chung toi da ghi nhan va se dieu chinh phu hop hon.",
      },
    ]);
    console.log(`✅ Da tao ${feedbackReplies.length} phan hoi danh gia\n`);

    // ============ Seed SalaryRates ============
    console.log("💵 Tao muc luong theo gio...");
    const salaryRates = await SalaryRate.insertMany([
      {
        userId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        hourlyRate: 50000,
        effectiveFrom: new Date("2026-01-01"),
        note: "Muc luong nhan vien chinh thuc",
        updatedBy: managerUser._id,
      },
      {
        userId: staffUsers[1]._id,
        canteenId: canteens[0]._id,
        hourlyRate: 45000,
        effectiveFrom: new Date("2026-01-01"),
        note: "Muc luong nhan vien chinh thuc",
        updatedBy: managerUser._id,
      },
      {
        userId: staffUsers[2]._id,
        canteenId: canteens[1]._id,
        hourlyRate: 48000,
        effectiveFrom: new Date("2026-01-01"),
        note: "Muc luong nhan vien chinh thuc",
        updatedBy: managerUser._id,
      },
    ]);
    console.log(`✅ Da tao ${salaryRates.length} muc luong theo gio\n`);

    // ============ Seed Payrolls ============
    console.log("💰 Tao ky luong...");
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const periodStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1,
    );
    const periodEnd = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0,
    );

    const payrolls = await Payroll.insertMany([
      {
        canteenId: canteens[0]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        description: `Luong thang ${lastMonth.getMonth() + 1}/${lastMonth.getFullYear()}`,
        totalStaff: 2,
        totalHours: 312,
        totalAmount: 15540000,
        totalBonus: 800000,
        totalDeduction: 100000,
        status: "paid",
        hourlyRate: 50000,
        isLocked: true,
        createdBy: managerUser._id,
        approvedBy: managerUser._id,
        approvedAt: new Date(periodEnd.getTime() + 2 * 24 * 60 * 60 * 1000),
        paidBy: managerUser._id,
        paidAt: new Date(periodEnd.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        canteenId: canteens[1]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        description: `Luong thang ${lastMonth.getMonth() + 1}/${lastMonth.getFullYear()}`,
        totalStaff: 1,
        totalHours: 168,
        totalAmount: 8264000,
        totalBonus: 200000,
        totalDeduction: 0,
        status: "approved",
        hourlyRate: 48000,
        isLocked: true,
        createdBy: managerUser._id,
        approvedBy: managerUser._id,
        approvedAt: new Date(periodEnd.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log(`✅ Da tao ${payrolls.length} ky luong\n`);

    // ============ Seed Salaries ============
    console.log("💰 Tao bang luong chi tiet...");

    const salaries = await Salary.insertMany([
      {
        payrollId: payrolls[0]._id,
        userId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        totalHours: 160,
        baseSalary: 8000000,
        bonus: 500000,
        deduction: 0,
        totalSalary: 8500000,
        status: "paid",
        calculatedAt: periodEnd,
        paidAt: new Date(periodEnd.getTime() + 5 * 24 * 60 * 60 * 1000),
        note: "Luong thang " + (lastMonth.getMonth() + 1),
      },
      {
        payrollId: payrolls[0]._id,
        userId: staffUsers[1]._id,
        canteenId: canteens[0]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        totalHours: 152,
        baseSalary: 6840000,
        bonus: 300000,
        deduction: 100000,
        totalSalary: 7040000,
        status: "paid",
        calculatedAt: periodEnd,
        paidAt: new Date(periodEnd.getTime() + 5 * 24 * 60 * 60 * 1000),
        note: "Luong thang " + (lastMonth.getMonth() + 1),
        adjustmentReason: "Khau tru do di tre 2 ngay",
      },
      {
        payrollId: payrolls[1]._id,
        userId: staffUsers[2]._id,
        canteenId: canteens[1]._id,
        periodStart: periodStart,
        periodEnd: periodEnd,
        totalHours: 168,
        baseSalary: 8064000,
        bonus: 200000,
        deduction: 0,
        totalSalary: 8264000,
        status: "approved",
        calculatedAt: periodEnd,
        note: "Luong thang " + (lastMonth.getMonth() + 1) + " - cho thanh toan",
      },
    ]);
    console.log(`✅ Da tao ${salaries.length} bang luong chi tiet\n`);

    // ============ Seed Notifications ============
    console.log("🔔 Tao thong bao...");
    const notifications = await Notification.insertMany([
      {
        userId: customers[0]._id,
        canteenId: canteens[0]._id,
        type: "order",
        title: "Don hang hoan thanh",
        content:
          "Don hang cua ban da duoc hoan thanh. Cam on ban da su dung dich vu!",
        isRead: true,
        readAt: new Date(),
        metadata: { orderId: order1._id },
      },
      {
        userId: customers[1]._id,
        canteenId: canteens[0]._id,
        type: "order",
        title: "Don hang san sang",
        content: "Don hang cua ban da san sang de lay!",
        isRead: false,
        metadata: { orderId: order2._id },
      },
      {
        userId: customers[2]._id,
        canteenId: canteens[0]._id,
        type: "order",
        title: "Don hang dang chuan bi",
        content: "Don hang cua ban dang duoc chuan bi",
        isRead: false,
        metadata: { orderId: order3._id },
      },
      {
        userId: customers[0]._id,
        type: "promotion",
        title: "Khuyen mai dac biet",
        content: "Giam 10% cho don hang dau tien voi ma WELCOME10",
        isRead: false,
        metadata: { voucherId: vouchers[0]._id },
      },
      {
        userId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        type: "shift",
        title: "Lich lam viec moi",
        content: "Ban da duoc phan cong ca sang ngay mai",
        isRead: true,
        readAt: new Date(),
        metadata: { shiftId: shifts[0]._id },
      },
      {
        userId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        type: "salary",
        title: "Luong da duoc thanh toan",
        content: "Luong thang truoc cua ban da duoc thanh toan",
        isRead: false,
        metadata: { salaryId: salaries[0]._id },
      },
      {
        userId: staffUsers[1]._id,
        canteenId: canteens[0]._id,
        type: "shift",
        title: "Yeu cau doi ca duoc duyet",
        content: "Yeu cau doi ca cua ban da duoc quan ly phe duyet",
        isRead: true,
        readAt: new Date(),
        metadata: { shiftChangeRequestId: shiftChangeRequests[1]._id },
      },
    ]);

    const systemNotifications = await SystemNotification.insertMany([
      {
        canteenId: canteens[0]._id,
        title: "Thong bao bao tri",
        content:
          "He thong se bao tri tu 22:00 - 06:00 ngay mai. Xin loi vi su bat tien nay.",
        targetRole: "all",
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        title: "Chao mung thanh vien moi",
        content:
          "Chao mung ban den voi UniLife Canteen! Kham pha cac mon an ngon va khuyen mai hap dan.",
        targetRole: "customer",
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        canteenId: canteens[0]._id,
        title: "Hop nhan vien",
        content: "Thong bao hop nhan vien vao 8:00 sang thu 2 hang tuan",
        targetRole: "staff",
        activeFrom: new Date(),
        activeTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: adminUser._id,
      },
    ]);
    console.log(
      `✅ Da tao ${notifications.length} thong bao, ${systemNotifications.length} thong bao he thong\n`,
    );

    // ============ Seed Report Data ============
    console.log("📊 Tao du lieu bao cao...");
    const reportSnapshots = await ReportSnapshot.insertMany([
      {
        canteenId: canteens[0]._id,
        reportType: "daily",
        reportName: "Bao cao ngay " + today.toISOString().slice(0, 10),
        periodStart: new Date(today.setHours(0, 0, 0, 0)),
        periodEnd: new Date(today.setHours(23, 59, 59, 999)),
        data: {
          totalOrders: 45,
          totalRevenue: 4500000,
          averageOrderValue: 100000,
          topProducts: [
            {
              productId: products[0]._id,
              productName: products[0].name,
              quantitySold: 25,
              revenue: 875000,
            },
            {
              productId: products[3]._id,
              productName: products[3].name,
              quantitySold: 18,
              revenue: 810000,
            },
          ],
          categorySales: [
            {
              categoryId: productCategories[0]._id,
              categoryName: "Com",
              totalSales: 35,
              revenue: 1225000,
            },
            {
              categoryId: productCategories[1]._id,
              categoryName: "Pho",
              totalSales: 20,
              revenue: 850000,
            },
          ],
          newCustomers: 8,
          returningCustomers: 37,
          totalFeedbacks: 12,
          averageRating: 4.5,
        },
        generatedBy: adminUser._id,
        generatedAt: new Date(),
      },
      {
        canteenId: canteens[0]._id,
        reportType: "weekly",
        reportName: "Bao cao tuan",
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        data: {
          totalOrders: 280,
          totalRevenue: 28000000,
          averageOrderValue: 100000,
          topProducts: [
            {
              productId: products[0]._id,
              productName: products[0].name,
              quantitySold: 150,
              revenue: 5250000,
            },
            {
              productId: products[1]._id,
              productName: products[1].name,
              quantitySold: 120,
              revenue: 4200000,
            },
          ],
          newCustomers: 45,
          returningCustomers: 235,
          totalFeedbacks: 85,
          averageRating: 4.3,
        },
        generatedBy: adminUser._id,
        generatedAt: new Date(),
      },
    ]);

    const auditLogs = await AuditLog.insertMany([
      {
        userId: adminUser._id,
        action: "login",
        entity: "user",
        entityId: adminUser._id,
        description: "Admin dang nhap he thong",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      },
      {
        userId: adminUser._id,
        canteenId: canteens[0]._id,
        action: "create",
        entity: "product",
        entityId: products[0]._id,
        description: "Tao san pham moi: " + products[0].name,
        newData: { name: products[0].name, price: products[0].price },
        ipAddress: "127.0.0.1",
      },
      {
        userId: staffUsers[0]._id,
        canteenId: canteens[0]._id,
        action: "order_status_change",
        entity: "order",
        entityId: order1._id,
        description: "Cap nhat trang thai don hang thanh completed",
        previousData: { status: "ready" },
        newData: { status: "completed" },
        ipAddress: "192.168.1.100",
      },
      {
        userId: managerUser._id,
        canteenId: canteens[0]._id,
        action: "settings_change",
        entity: "canteen",
        entityId: canteens[0]._id,
        description: "Cap nhat gio mo cua cang tin",
        previousData: { openingHours: "07:00 - 19:00" },
        newData: { openingHours: "06:00 - 20:00" },
        ipAddress: "127.0.0.1",
      },
    ]);

    const shiftSummaries = await ShiftSummary.insertMany([
      {
        canteenId: canteens[0]._id,
        shiftId: shifts[0]._id,
        date: today,
        staffAssigned: [staffUsers[0]._id, staffUsers[1]._id],
        summary: {
          totalOrders: 55,
          completedOrders: 52,
          cancelledOrders: 3,
          totalRevenue: 5500000,
          averageOrderTime: 12,
          peakHour: "11:00",
          topSellingProducts: [
            {
              productId: products[0]._id,
              productName: products[0].name,
              quantity: 30,
            },
            {
              productId: products[3]._id,
              productName: products[3].name,
              quantity: 22,
            },
          ],
        },
        notes: "Ca lam viec binh thuong",
        status: "closed",
        reviewedBy: managerUser._id,
        reviewedAt: new Date(),
      },
      {
        canteenId: canteens[0]._id,
        shiftId: shifts[1]._id,
        date: today,
        staffAssigned: [staffUsers[0]._id],
        summary: {
          totalOrders: 65,
          completedOrders: 63,
          cancelledOrders: 2,
          totalRevenue: 6500000,
          averageOrderTime: 10,
          peakHour: "12:30",
          topSellingProducts: [
            {
              productId: products[1]._id,
              productName: products[1].name,
              quantity: 35,
            },
            {
              productId: products[5]._id,
              productName: products[5].name,
              quantity: 28,
            },
          ],
        },
        notes: "Ca trua dong khach",
        status: "open",
      },
    ]);

    const pickupLogs = await PickupLog.insertMany([
      {
        orderId: order1._id,
        canteenId: canteens[0]._id,
        customerId: customers[0]._id,
        staffId: staffUsers[0]._id,
        action: "qr_generated",
        qrCode: "QR_" + order1._id.toString(),
        notes: "QR code duoc tao tu dong",
      },
      {
        orderId: order1._id,
        canteenId: canteens[0]._id,
        customerId: customers[0]._id,
        staffId: staffUsers[0]._id,
        action: "qr_scanned",
        qrCode: "QR_" + order1._id.toString(),
        scannedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        notes: "Khach hang quet ma QR",
      },
      {
        orderId: order1._id,
        canteenId: canteens[0]._id,
        customerId: customers[0]._id,
        staffId: staffUsers[0]._id,
        action: "pickup_confirmed",
        qrCode: "QR_" + order1._id.toString(),
        scannedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        notes: "Don hang da duoc giao",
      },
      {
        orderId: order2._id,
        canteenId: canteens[0]._id,
        customerId: customers[1]._id,
        action: "qr_generated",
        qrCode: "QR_" + order2._id.toString(),
        notes: "QR code duoc tao tu dong",
      },
    ]);
    console.log(
      `✅ Da tao ${reportSnapshots.length} bao cao, ${auditLogs.length} audit log, ${shiftSummaries.length} tom tat ca, ${pickupLogs.length} pickup log\n`,
    );

    // ============ Summary ============
    console.log("✨ Seed du lieu hoan tat!\n");
    console.log("📊 Thong ke:");
    console.log(`   - Campuses: ${campuses.length}`);
    console.log(`   - Canteens: ${canteens.length}`);
    console.log(`   - Users: ${4 + staffUsers.length + customers.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Product Categories: ${productCategories.length}`);
    console.log(`   - Ingredient Categories: ${ingredientCategories.length}`);
    console.log(`   - Ingredients: ${ingredients.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Menus: ${menus.length}`);
    console.log(`   - Menu Schedules: ${menuSchedules.length}`);
    console.log(`   - Shifts: ${shifts.length}`);
    console.log(`   - Staff Shifts: ${staffShifts.length}`);
    console.log(`   - Shift Change Requests: ${shiftChangeRequests.length}`);
    console.log(`   - Vouchers: ${vouchers.length}`);
    console.log(`   - Voucher Usages: ${voucherUsages.length}`);
    console.log(`   - Banners: ${banners.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Carts: ${carts.length}`);
    console.log(`   - Wishlists: ${wishlists.length}`);
    console.log(`   - Feedbacks: ${feedbacks.length}`);
    console.log(`   - Feedback Replies: ${feedbackReplies.length}`);
    console.log(`   - Payrolls: ${payrolls.length}`);
    console.log(`   - Salaries: ${salaries.length}`);
    console.log(`   - Salary Rates: ${salaryRates.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - System Notifications: ${systemNotifications.length}`);
    console.log(`   - Report Snapshots: ${reportSnapshots.length}`);
    console.log(`   - Audit Logs: ${auditLogs.length}`);
    console.log(`   - Shift Summaries: ${shiftSummaries.length}`);
    console.log(`   - Pickup Logs: ${pickupLogs.length}`);

    console.log("\n🔐 Thong tin dang nhap mac dinh:");
    console.log("   Admin: admin@unilife.com / 123456");
    console.log("   Manager: manager@unilife.com / 123456");
    console.log("   Staff: staff1@unilife.com / 123456");
    console.log("   Customer: customer1@gmail.com / 123456");

    process.exit(0);
  } catch (error) {
    console.error("❌ Loi khi seed du lieu:", error);
    process.exit(1);
  }
};

// Chay seeder
seedDatabase();
