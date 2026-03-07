# Audit Log Module (Nhật ký hoạt động)

## Mô tả

Module Audit Log dùng để ghi lại và theo dõi tất cả các hoạt động của hệ thống nhằm mục đích:

- **Giám sát bảo mật**: Theo dõi các hành động của người dùng
- **Tuân thủ**: Lưu giữ hồ sơ các thay đổi dữ liệu
- **Kiểm tra lỗi**: Xác định nguyên nhân các vấn đề hệ thống
- **Phân tích**: Hiểu rõ các hoạt động người dùng

## Cấu trúc

```
auditLog/
├── auditLog.model.js      # MongoDB Schema
├── auditLog.service.js    # Business logic
├── auditLog.controller.js # Route handlers
├── auditLog.routes.js     # API endpoints
├── auditLog.middleware.js # Auto-logging middleware
└── README.md              # Documentation
```

## API Endpoints

### 1. Lấy danh sách nhật ký

```http
GET /api/audit-logs
```

**Query Parameters:**

| Parameter    | Type   | Required | Mô tả                                                               |
| ------------ | ------ | -------- | ------------------------------------------------------------------- |
| page         | number | false    | Trang (mặc định: 1)                                                 |
| limit        | number | false    | Số lượng/trang (mặc định: 20)                                       |
| action       | string | false    | Loại hành động (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, ERROR) |
| resourceType | string | false    | Loại tài nguyên (User, Product, Ingredient, Order...)               |
| userId       | string | false    | ID người dùng                                                       |
| canteenId    | string | false    | ID canteen                                                          |
| startDate    | string | false    | Ngày bắt đầu (YYYY-MM-DD)                                           |
| endDate      | string | false    | Ngày kết thúc (YYYY-MM-DD)                                          |

**Ví dụ:**

```bash
GET /api/audit-logs?page=1&limit=20&action=CREATE&resourceType=Product
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "60d5ec49c1d2a4001f8b1a1a",
      "action": "CREATE",
      "module": "Product",
      "description": "Tạo Product mới",
      "userId": "60d5ec49c1d2a4001f8b1a1b",
      "userName": "Nguyễn Văn A",
      "userEmail": "a@example.com",
      "userRole": "admin",
      "resourceType": "Product",
      "resourceId": "60d5ec49c1d2a4001f8b1a2a",
      "resourceName": "Phở Bò",
      "statusCode": 201,
      "createdAt": "2024-03-04T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 2. Lấy chi tiết một nhật ký

```http
GET /api/audit-logs/:id
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "auditLog": {
      "_id": "60d5ec49c1d2a4001f8b1a1a",
      "action": "UPDATE",
      "module": "Ingredient",
      "description": "Cập nhật Ingredient",
      "oldValues": {
        "stock": 100
      },
      "newValues": {
        "stock": 95
      }
    }
  }
}
```

### 3. Lấy nhật ký theo người dùng

```http
GET /api/audit-logs/users/:userId
```

**Query Parameters:**

| Parameter | Type   | Mô tả                         |
| --------- | ------ | ----------------------------- |
| page      | number | Trang (mặc định: 1)           |
| limit     | number | Số lượng/trang (mặc định: 20) |
| days      | number | Số ngày (mặc định: 30)        |

### 4. Lấy nhật ký theo tài nguyên

```http
GET /api/audit-logs/resources/:resourceType/:resourceId
```

**Ví dụ:** `GET /api/audit-logs/resources/Product/60d5ec49c1d2a4001f8b1a2a`

### 5. Lấy thống kê hoạt động

```http
GET /api/audit-logs/statistics/activity
```

**Query Parameters:**

| Parameter | Type   | Mô tả                  |
| --------- | ------ | ---------------------- |
| days      | number | Số ngày (mặc định: 30) |

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalActions": 256,
    "actionsByType": [
      { "_id": "CREATE", "count": 120 },
      { "_id": "UPDATE", "count": 100 },
      { "_id": "DELETE", "count": 36 }
    ],
    "actionsByUser": [
      { "_id": "userId", "count": 85, "userName": "Nguyễn Văn A" },
      { "_id": "userId", "count": 65, "userName": "Trần Thị B" }
    ],
    "period": {
      "startDate": "2024-02-04T00:00:00Z",
      "days": 30
    }
  }
}
```

### 6. Lấy nhật ký lỗi

```http
GET /api/audit-logs/errors/list
```

**Query Parameters:**

| Parameter | Type   | Mô tả                         |
| --------- | ------ | ----------------------------- |
| page      | number | Trang (mặc định: 1)           |
| limit     | number | Số lượng/trang (mặc định: 20) |
| days      | number | Số ngày (mặc định: 7)         |

### 7. Xóa nhật ký cũ (Admin only)

```http
DELETE /api/audit-logs/cleanup/old
```

**Query Parameters:**

| Parameter | Type   | Mô tả                  |
| --------- | ------ | ---------------------- |
| days      | number | Số ngày (mặc định: 90) |

**Response:**

```json
{
  "status": "success",
  "message": "Đã xóa 145 nhật ký hoạt động",
  "data": {
    "deletedCount": 145
  }
}
```

## Cách hoạt động

### Auto-Logging

Module tự động ghi lại các hành động CREATE, UPDATE, DELETE thông qua middleware:

1. **captureOldValues**: Lưu trữ dữ liệu cũ từ request body trước khi update
2. **auditLogMiddleware**: Ghi nhật ký hoạt động sau khi xử lý thành công
3. **auditErrorLogging**: Ghi lại các lỗi xảy ra
4. **auditAuthEvent**: Ghi lại đăng nhập/đăng xuất

### Quy trình

```
Request → Middleware (captureOldValues) → Controller → Service → Response
  ↓
  ├─ Override res.json()
  ├─ Ghi nhật ký vào Database (fire and forget)
  └─ Trả response cho client
```

## Schema

**Trường dữ liệu:**

```javascript
{
  // Thông tin hành động
  action: 'CREATE|READ|UPDATE|DELETE|LOGIN|LOGOUT|ERROR',
  module: 'Product',
  description: 'Tạo Product mới',

  // Thông tin người dùng
  userId: ObjectId,
  userName: 'Nguyễn Văn A',
  userEmail: 'a@example.com',
  userRole: 'admin|staff|manager|customer',

  // Thông tin canteen
  canteenId: ObjectId,

  // Thông tin tài nguyên
  resourceType: 'Product',
  resourceId: ObjectId,
  resourceName: 'Phở Bò',

  // Dữ liệu thay đổi
  oldValues: { stock: 100 },
  newValues: { stock: 95 },

  // Thông tin request
  method: 'POST|PUT|PATCH|DELETE',
  endpoint: '/api/products',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  statusCode: 201,

  // Thông tin lỗi
  errorMessage: 'Validation failed',
  errorStack: '...',

  // Thời gian
  createdAt: Date
}
```

**Indexes:**

- `createdAt`: TTL index (90 ngày) - tự động xóa sau 90 ngày
- `action, createdAt`: Query nhanh theo hành động
- `userId, createdAt`: Query nhanh theo người dùng
- `resourceType, resourceId`: Query nhanh theo tài nguyên
- `canteenId, createdAt`: Query nhanh theo canteen

## Quyền truy cập

| Người dùng    | Quyền                        |
| ------------- | ---------------------------- |
| Admin         | Xem tất cả, xóa nhật ký cũ   |
| Staff/Manager | Xem nhật ký canteen của mình |
| Customer      | Không có quyền               |

## Sử dụng trong Frontend

### Ví dụ: Lấy nhật ký tài nguyên

```javascript
import * as auditLogService from '@/services/auditLog.service';

// Lấy lịch sử thay đổi của một Product
const { logs, pagination } = await auditLogService.getAuditLogsByResource(
  'Product',
  'productId'
);

// Hiển thị timeline
logs.forEach((log) => {
  console.log(`${log.createdAt}: ${log.description}`);
  console.log(`Trước: ${JSON.stringify(log.oldValues)}`);
  console.log(`Sau: ${JSON.stringify(log.newValues)}`);
});
```

### Ví dụ: Dashboard thống kê

```javascript
// Lấy thống kê hoạt động trong 7 ngày
const stats = await auditLogService.getActivityStatistics({ days: 7 });

// Biểu đồ hành động
stats.actionsByType; // [{ _id: 'CREATE', count: 120 }, ...]

// Người dùng hoạt động nhất
stats.actionsByUser; // [{ _id: userId, count: 85, userName: 'Nguyễn Văn A' }, ...]
```

## Best Practices

1. **Dùng canteenId**: Luôn lọc theo `canteenId` trong multi-tenant environment
2. **Giới hạn ngày**: Set `days` phù hợp để tránh query quá lâu
3. **Backup dữ liệu**: Sao lưu nhật ký quan trọng trước khi xóa
4. **Giám sát lỗi**: Kiểm tra `getErrorLogs()` định kỳ
5. **Cleanup định kỳ**: Chạy `deleteOldAuditLogs()` hàng tháng

## Troubleshooting

### Lỗi: "Cannot find module auditLog"

- Kiểm tra đã import routes trong `app.js`
- Kiểm tra đã import middleware trong `app.js`

### Performance chậm

- Kiểm tra indexes có được tạo không
- Giới hạn `limit` và `days` thích hợp
- Xóa nhật ký cũ định kỳ

### Dữ liệu lỗi không chính xác

- Kiểm tra middleware được apply trước controller
- Kiểm tra error handler middleware ở cuối

## Tham khảo

- Model: `auditLog.model.js`
- Service: `auditLog.service.js`
- Controller: `auditLog.controller.js`
- Routes: `auditLog.routes.js`
- Middleware: `auditLog.middleware.js`
