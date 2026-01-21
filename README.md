# 🍽️ UniLife Backend

> University Canteen Management System - Backend API

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Design](#database-design)

---

## 🎯 Overview

UniLife is a comprehensive university canteen management system that handles:

- User authentication & authorization (JWT + OAuth)
- Role-based access control with permissions
- Canteen and product management with categories
- Ingredient and recipe management
- Menu scheduling
- Order processing with QR code pickup
- Shopping cart
- Staff shift management
- Salary calculation
- Customer feedback and ratings
- Vouchers and promotions
- Banners and notifications
- Reports and analytics

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Module System:** ES Modules (import/export)

---

## 📁 Project Structure

```
src/
├── config/
│   └── db.js                 # MongoDB connection
├── middlewares/
│   ├── auth.middleware.js    # JWT authentication & authorization
│   └── error.middleware.js   # Global error handler
├── utils/
│   ├── jwt.js                # JWT utilities
│   ├── catchAsync.js         # Async error wrapper
│   └── AppError.js           # Custom error class
├── modules/
│   ├── auth/                 # Authentication module
│   ├── user/                 # User management
│   ├── role/                 # Roles & permissions
│   ├── token/                # Tokens & OTP
│   ├── canteen/              # Canteen management
│   ├── category/             # Product & ingredient categories
│   ├── product/              # Product management
│   ├── ingredient/           # Ingredients & recipes
│   ├── menu/                 # Menu & scheduling
│   ├── cart/                 # Shopping cart
│   ├── order/                # Order processing
│   ├── shift/                # Shift management
│   ├── salary/               # Salary calculation
│   ├── feedback/             # Customer feedback
│   ├── voucher/              # Vouchers & promotions
│   ├── banner/               # Promotional banners
│   ├── notification/         # Notifications
│   └── report/               # Reports & analytics
├── app.js                    # Express app configuration
└── server.js                 # Server entry point
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd UniLife_BE
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/unilife
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

4. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 📖 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

| Method | Endpoint                | Description            | Access |
| ------ | ----------------------- | ---------------------- | ------ |
| POST   | `/auth/register`        | Register new user      | Public |
| POST   | `/auth/login`           | User login             | Public |
| POST   | `/auth/refresh-token`   | Refresh access token   | Public |
| POST   | `/auth/forgot-password` | Request password reset | Public |
| POST   | `/auth/reset-password`  | Reset password         | Public |

### Users

| Method | Endpoint     | Description      | Access    |
| ------ | ------------ | ---------------- | --------- |
| GET    | `/users`     | Get all users    | Admin     |
| GET    | `/users/me`  | Get current user | Protected |
| GET    | `/users/:id` | Get user by ID   | Admin     |
| PATCH  | `/users/:id` | Update user      | Admin     |
| DELETE | `/users/:id` | Delete user      | Admin     |

### Roles & Permissions

| Method | Endpoint                 | Description         | Access |
| ------ | ------------------------ | ------------------- | ------ |
| GET    | `/roles`                 | Get all roles       | Admin  |
| POST   | `/roles`                 | Create role         | Admin  |
| PATCH  | `/roles/:id`             | Update role         | Admin  |
| DELETE | `/roles/:id`             | Delete role         | Admin  |
| GET    | `/roles/permissions`     | Get all permissions | Admin  |
| POST   | `/roles/:id/permissions` | Assign permissions  | Admin  |

### Canteens

| Method | Endpoint        | Description       | Access |
| ------ | --------------- | ----------------- | ------ |
| GET    | `/canteens`     | Get all canteens  | Public |
| GET    | `/canteens/:id` | Get canteen by ID | Public |
| POST   | `/canteens`     | Create canteen    | Admin  |
| PATCH  | `/canteens/:id` | Update canteen    | Admin  |
| DELETE | `/canteens/:id` | Delete canteen    | Admin  |

### Categories

| Method | Endpoint                  | Description                | Access      |
| ------ | ------------------------- | -------------------------- | ----------- |
| GET    | `/categories/products`    | Get product categories     | Public      |
| POST   | `/categories/products`    | Create product category    | Staff/Admin |
| GET    | `/categories/ingredients` | Get ingredient categories  | Staff/Admin |
| POST   | `/categories/ingredients` | Create ingredient category | Staff/Admin |

### Products

| Method | Endpoint                             | Description              | Access      |
| ------ | ------------------------------------ | ------------------------ | ----------- |
| GET    | `/products`                          | Get all products         | Public      |
| GET    | `/products/:id`                      | Get product by ID        | Public      |
| GET    | `/products/canteen/:canteenId`       | Get products by canteen  | Public      |
| POST   | `/products`                          | Create product           | Staff/Admin |
| PATCH  | `/products/:id`                      | Update product           | Staff/Admin |
| DELETE | `/products/:id`                      | Delete product           | Admin       |
| POST   | `/products/:id/recipe`               | Add recipe ingredient    | Staff/Admin |
| DELETE | `/products/:id/recipe/:ingredientId` | Remove recipe ingredient | Staff/Admin |

### Ingredients

| Method | Endpoint           | Description          | Access      |
| ------ | ------------------ | -------------------- | ----------- |
| GET    | `/ingredients`     | Get all ingredients  | Staff/Admin |
| GET    | `/ingredients/:id` | Get ingredient by ID | Staff/Admin |
| POST   | `/ingredients`     | Create ingredient    | Staff/Admin |
| PATCH  | `/ingredients/:id` | Update ingredient    | Staff/Admin |
| DELETE | `/ingredients/:id` | Delete ingredient    | Admin       |

### Menus

| Method | Endpoint                           | Description      | Access      |
| ------ | ---------------------------------- | ---------------- | ----------- |
| GET    | `/menus`                           | Get all menus    | Public      |
| GET    | `/menus/:id`                       | Get menu by ID   | Public      |
| GET    | `/menus/canteen/:canteenId/active` | Get active menu  | Public      |
| POST   | `/menus`                           | Create menu      | Staff/Admin |
| PATCH  | `/menus/:id`                       | Update menu      | Staff/Admin |
| DELETE | `/menus/:id`                       | Delete menu      | Admin       |
| POST   | `/menus/:id/items`                 | Add menu item    | Staff/Admin |
| DELETE | `/menus/:id/items/:productId`      | Remove menu item | Staff/Admin |

### Cart

| Method | Endpoint              | Description      | Access    |
| ------ | --------------------- | ---------------- | --------- |
| GET    | `/cart`               | Get my cart      | Protected |
| POST   | `/cart/items`         | Add item to cart | Protected |
| PATCH  | `/cart/items/:itemId` | Update cart item | Protected |
| DELETE | `/cart/items/:itemId` | Remove cart item | Protected |
| DELETE | `/cart`               | Clear cart       | Protected |

### Orders

| Method | Endpoint               | Description           | Access      |
| ------ | ---------------------- | --------------------- | ----------- |
| POST   | `/orders`              | Create order          | Customer    |
| GET    | `/orders`              | Get all orders        | Staff/Admin |
| GET    | `/orders/my-orders`    | Get my orders         | Protected   |
| GET    | `/orders/:id`          | Get order by ID       | Protected   |
| GET    | `/orders/qr/:code`     | Get order by QR code  | Staff       |
| PATCH  | `/orders/:id/status`   | Update order status   | Staff/Admin |
| PATCH  | `/orders/:id/payment`  | Update payment status | Staff/Admin |
| PATCH  | `/orders/:id/cancel`   | Cancel order          | Protected   |
| PATCH  | `/orders/:id/complete` | Complete order        | Staff       |
| GET    | `/orders/stats`        | Get order statistics  | Admin       |

### Shifts

| Method | Endpoint                            | Description         | Access      |
| ------ | ----------------------------------- | ------------------- | ----------- |
| GET    | `/shifts`                           | Get all shifts      | Staff/Admin |
| GET    | `/shifts/:id`                       | Get shift by ID     | Staff/Admin |
| POST   | `/shifts`                           | Create shift        | Admin       |
| PATCH  | `/shifts/:id`                       | Update shift        | Admin       |
| DELETE | `/shifts/:id`                       | Delete shift        | Admin       |
| GET    | `/shifts/assignments`               | Get all assignments | Staff/Admin |
| GET    | `/shifts/my-assignments`            | Get my assignments  | Staff       |
| POST   | `/shifts/assignments`               | Assign staff        | Admin       |
| POST   | `/shifts/assignments/:id/check-in`  | Check in            | Staff       |
| POST   | `/shifts/assignments/:id/check-out` | Check out           | Staff       |

### Salaries

| Method | Endpoint                | Description      | Access |
| ------ | ----------------------- | ---------------- | ------ |
| GET    | `/salaries`             | Get all salaries | Admin  |
| GET    | `/salaries/my-salaries` | Get my salaries  | Staff  |
| POST   | `/salaries/calculate`   | Calculate salary | Admin  |
| PATCH  | `/salaries/:id/approve` | Approve salary   | Admin  |
| PATCH  | `/salaries/:id/pay`     | Mark as paid     | Admin  |

### Feedbacks

| Method | Endpoint               | Description        | Access      |
| ------ | ---------------------- | ------------------ | ----------- |
| GET    | `/feedbacks`           | Get all feedbacks  | Public      |
| POST   | `/feedbacks`           | Create feedback    | Protected   |
| GET    | `/feedbacks/:id`       | Get feedback by ID | Public      |
| POST   | `/feedbacks/:id/reply` | Reply to feedback  | Staff/Admin |
| DELETE | `/feedbacks/:id`       | Delete feedback    | Admin       |

### Vouchers

| Method | Endpoint              | Description        | Access    |
| ------ | --------------------- | ------------------ | --------- |
| GET    | `/vouchers`           | Get all vouchers   | Admin     |
| GET    | `/vouchers/available` | Get valid vouchers | Protected |
| POST   | `/vouchers`           | Create voucher     | Admin     |
| POST   | `/vouchers/validate`  | Validate voucher   | Protected |
| PATCH  | `/vouchers/:id`       | Update voucher     | Admin     |
| DELETE | `/vouchers/:id`       | Delete voucher     | Admin     |

### Banners

| Method | Endpoint          | Description        | Access |
| ------ | ----------------- | ------------------ | ------ |
| GET    | `/banners/active` | Get active banners | Public |
| GET    | `/banners`        | Get all banners    | Admin  |
| POST   | `/banners`        | Create banner      | Admin  |
| PATCH  | `/banners/:id`    | Update banner      | Admin  |
| DELETE | `/banners/:id`    | Delete banner      | Admin  |

### Notifications

| Method | Endpoint                       | Description                | Access    |
| ------ | ------------------------------ | -------------------------- | --------- |
| GET    | `/notifications/my`            | Get my notifications       | Protected |
| GET    | `/notifications/unread-count`  | Get unread count           | Protected |
| PATCH  | `/notifications/:id/read`      | Mark as read               | Protected |
| PATCH  | `/notifications/read-all`      | Mark all as read           | Protected |
| GET    | `/notifications/system/active` | Get system notifications   | Protected |
| POST   | `/notifications/system`        | Create system notification | Admin     |

### Reports

| Method | Endpoint                                  | Description           | Access  |
| ------ | ----------------------------------------- | --------------------- | ------- |
| GET    | `/reports/snapshots/canteen/:canteenId`   | Get report snapshots  | Manager |
| POST   | `/reports/snapshots/generate-daily`       | Generate daily report | Manager |
| GET    | `/reports/audit-logs`                     | Get audit logs        | Admin   |
| GET    | `/reports/shift-summaries/canteen/:id`    | Get shift summaries   | Manager |
| GET    | `/reports/pickup-logs/canteen/:canteenId` | Get pickup logs       | Manager |

---

## 🗄️ Database Design

### Why MongoDB + Embedded Documents?

This project uses **MongoDB best practices** with a combination of **embedding** and **referencing**:

#### Embedded Documents (Denormalization)

Used when:

- Data is frequently accessed together
- Child data doesn't make sense without parent
- Bounded arrays (won't grow indefinitely)

**Examples:**

- `Product.recipe[]` - Ingredients are always fetched with product
- `Order.items[]` - Order items belong to the order
- `Order.payment` - Payment info is always needed with order
- `Order.pickupQRCode` - QR code is part of order
- `Menu.items[]` - Menu items are fetched together

#### References (Normalization)

Used when:

- Data is accessed independently
- Many-to-many relationships
- Data is frequently updated

**Examples:**

- `Order.userId` → User
- `Product.canteenId` → Canteen
- `Shift.canteenId` → Canteen

### Collections Overview

1. **Users** - User accounts with roles
2. **Canteens** - Canteen locations
3. **Products** - Menu items with embedded recipes
4. **Menus** - Daily menus with embedded items
5. **MenuSchedules** - Menu scheduling
6. **Orders** - Orders with embedded items, payment, QR code
7. **Shifts** - Work shifts
8. **ShiftAssignments** - Staff shift assignments
9. **Salaries** - Salary records

---

## 🔐 Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **admin** - Full system access
- **staff** - Canteen operations
- **customer** - Order placement

---

## 📝 License

MIT License

---

## 👥 Authors

UniLife Development Team
