# API Pagination Guide - UniLife Backend

Tất cả endpoints hỗ trợ pagination đã được cập nhật với query helper utility.

## 📋 Danh sách Endpoints có Pagination

### 1. 👤 Users

```
GET /api/users?page=1&limit=10&search=nguyen&role=customer&status=active&sort=-createdAt
```

**Filters:** `role`, `status`, `emailVerified`, `canteenId`  
**Search:** `fullName`, `email`, `phone`  
**Sort:** `createdAt`, `fullName`, `email`, `balance`

---

### 2. 📦 Products

```
GET /api/products?page=1&limit=10&search=cơm&status=available&price[gte]=20000&price[lte]=50000&sort=-price
GET /api/products/canteen/:canteenId?page=1&limit=10
```

**Filters:** `categoryId`, `canteenId`, `status`, `isPopular`, `isNew`  
**Search:** `name`, `description`, `slug`  
**Sort:** `createdAt`, `name`, `price`, `stockQuantity`

---

### 3. 🛒 Orders

```
GET /api/orders?page=1&limit=10&status=completed&sort=-createdAt
GET /api/orders/my-orders?page=1&limit=10&status=pending
```

**Filters:** `status`, `canteenId`, `userId`, `payment.method`, `payment.status`  
**Search:** `orderNumber`  
**Sort:** `createdAt`, `totalAmount`, `status`

---

### 4. 💬 Feedbacks

```
GET /api/feedbacks?page=1&limit=10&rating=5&status=approved
GET /api/feedbacks/product/:productId?page=1&limit=10
GET /api/feedbacks/:feedbackId/replies?page=1&limit=10
```

**Filters:** `rating`, `status`, `productId`, `userId`, `canteenId`  
**Search:** `comment`  
**Sort:** `createdAt`, `rating`

---

### 5. 🔔 Notifications

```
GET /api/notifications?page=1&limit=10&type=order&isRead=false&sort=-createdAt
GET /api/notifications/system?page=1&limit=10&isActive=true&targetRole=customer
```

**Filters:** `type`, `isRead`, `userId`, `canteenId`, `targetRole`, `isActive`  
**Search:** `title`, `content`  
**Sort:** `createdAt`, `isRead`

---

### 6. 🥬 Ingredients

```
GET /api/ingredients?page=1&limit=10&canteenId=xxx&categoryId=xxx
GET /api/ingredients/low-stock?threshold=10&page=1&limit=20
```

**Filters:** `categoryId`, `canteenId`  
**Search:** `name`  
**Sort:** `createdAt`, `name`, `stock`

---

### 7. 🎟️ Vouchers

```
GET /api/vouchers?page=1&limit=10&isActive=true&discountType=percentage
GET /api/vouchers/my-usage?page=1&limit=10
```

**Filters:** `isActive`, `discountType`  
**Search:** `code`, `description`  
**Sort:** `createdAt`, `code`, `value`, `startDate`, `endDate`

---

### 8. 🎨 Banners

```
GET /api/banners?page=1&limit=10&isActive=true&canteenId=xxx&sort=order
```

**Filters:** `isActive`, `canteenId`  
**Search:** `title`  
**Sort:** `createdAt`, `order`

---

### 9. ⏰ Shifts

```
GET /api/shifts?page=1&limit=10&canteenId=xxx&status=active
GET /api/shifts/assignments?page=1&limit=10&status=scheduled&date=2026-01-22
GET /api/shifts/my-assignments?page=1&limit=10
```

**Filters:** `canteenId`, `status`, `shiftId`, `staffId`, `date`  
**Search:** `name`  
**Sort:** `createdAt`, `name`, `startTime`, `date`

---

### 10. 💰 Salaries

```
GET /api/salaries?page=1&limit=10&status=paid&startDate=2026-01-01&endDate=2026-01-31
GET /api/salaries/my-salaries?page=1&limit=10
```

**Filters:** `userId`, `canteenId`, `status`  
**Sort:** `createdAt`, `periodStart`, `totalSalary`  
**Date Range:** `startDate`, `endDate` (cho periodStart)

---

## 🔧 Query Parameters Chung

### Pagination

| Parameter | Type   | Mô tả          | Mặc định |
| --------- | ------ | -------------- | -------- |
| `page`    | number | Số trang       | 1        |
| `limit`   | number | Số items/trang | 10       |

### Sorting

```
sort=fieldName          # Tăng dần
sort=-fieldName         # Giảm dần
sort=-price,name        # Nhiều field
```

### Field Selection

```
fields=name,price,image  # Chỉ lấy các field này
```

### Search

```
search=keyword          # Tìm trong các trường searchFields
```

### Filtering

**Exact match:**

```
status=active
role=customer
```

**Range filters:**

```
price[gte]=20000       # Greater than or equal
price[gt]=10000        # Greater than
price[lte]=50000       # Less than or equal
price[lt]=100000       # Less than
rating[gte]=4
```

**Not equal:**

```
status[ne]=cancelled
```

**In array:**

```
status[in]=pending,confirmed,ready
categoryId[in]=id1,id2,id3
```

**Not in array:**

```
status[nin]=cancelled,failed
```

**Boolean:**

```
isActive=true
emailVerified=false
```

---

## 📤 Response Format

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [
    {
      /* item 1 */
    },
    {
      /* item 2 */
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 💡 Ví dụ Thực tế

### 1. Lấy đơn hàng đã hoàn thành trong tháng 1/2026

```
GET /api/orders?status=completed&startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20&sort=-createdAt
```

### 2. Tìm khách hàng có email chứa "gmail"

```
GET /api/users?search=gmail&role=customer&page=1&limit=20
```

### 3. Lấy sản phẩm phổ biến, giá dưới 50k

```
GET /api/products?isPopular=true&price[lte]=50000&sort=-createdAt&page=1&limit=12
```

### 4. Feedback 5 sao cho sản phẩm

```
GET /api/feedbacks/product/:productId?rating=5&page=1&limit=10&sort=-createdAt
```

### 5. Nguyên liệu sắp hết của căng tin A

```
GET /api/ingredients/low-stock?canteenId=xxx&threshold=10&page=1&limit=20&sort=stock
```

### 6. Lịch ca làm việc của tôi tháng này

```
GET /api/shifts/my-assignments?date[gte]=2026-01-01&date[lte]=2026-01-31&page=1&limit=30&sort=date
```

### 7. Voucher đang active, giảm theo %

```
GET /api/vouchers?isActive=true&discountType=percentage&sort=-value&page=1&limit=10
```

---

## 🎯 Frontend Integration Examples

### React/Next.js Example

```javascript
const fetchPaginatedData = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 10,
    ...params,
  }).toString();

  const response = await fetch(`/api/${endpoint}?${queryString}`);
  return response.json();
};

// Usage
const { data, pagination } = await fetchPaginatedData("products", {
  page: 1,
  limit: 12,
  status: "available",
  sort: "-createdAt",
});
```

### Pagination Component

```jsx
const Pagination = ({ pagination, onPageChange }) => {
  return (
    <div className="pagination">
      <button
        disabled={!pagination.hasPrevPage}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Previous
      </button>

      <span>
        Page {pagination.page} of {pagination.totalPages}
      </span>

      <button
        disabled={!pagination.hasNextPage}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  );
};
```

### Infinite Scroll Example

```javascript
const [items, setItems] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const result = await fetchPaginatedData("products", { page, limit: 20 });
  setItems((prev) => [...prev, ...result.data]);
  setHasMore(result.pagination.hasNextPage);
  setPage((prev) => prev + 1);
};
```

---

## 🚀 Performance Tips

1. **Giới hạn limit hợp lý:**
   - Mobile: 10-15 items
   - Desktop: 20-30 items
   - Không vượt quá 100 items

2. **Sử dụng field selection:**

   ```
   ?fields=_id,name,price,image
   ```

   để giảm dung lượng response

3. **Cache dữ liệu** ở frontend để tránh gọi API nhiều lần

4. **Debounce search input** để giảm số request khi user typing

5. **Index database** đúng cách cho các trường thường filter/sort

---

## ❗ Error Handling

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid query parameters"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## 📝 Notes

- Tất cả endpoints pagination đều hỗ trợ populate relationships
- Max limit mặc định: 100 items
- Search là case-insensitive
- Filter hỗ trợ ObjectId, Boolean, Number, String
- Date filters có thể dùng ISO string hoặc timestamp
