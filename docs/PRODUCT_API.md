# Product API - Hướng dẫn sử dụng Pagination

## Endpoints

### 1. Lấy tất cả sản phẩm (có phân trang)

```
GET /api/products
```

#### Query Parameters

| Parameter | Type   | Mô tả                                       | Ví dụ                     |
| --------- | ------ | ------------------------------------------- | ------------------------- |
| `page`    | number | Số trang (mặc định: 1)                      | `page=2`                  |
| `limit`   | number | Số items mỗi trang (mặc định: 10, max: 100) | `limit=20`                |
| `sort`    | string | Sắp xếp theo trường (thêm `-` để giảm dần)  | `sort=-price,name`        |
| `fields`  | string | Chọn các trường cần trả về                  | `fields=name,price,image` |
| `search`  | string | Tìm kiếm trong name, description, slug      | `search=cơm`              |

#### Filters

| Filter       | Mô tả                      | Ví dụ                                 |
| ------------ | -------------------------- | ------------------------------------- |
| `status`     | Trạng thái sản phẩm        | `status=available`                    |
| `categoryId` | Lọc theo danh mục          | `categoryId=507f1f77bcf86cd799439011` |
| `canteenId`  | Lọc theo căng tin          | `canteenId=507f1f77bcf86cd799439011`  |
| `isPopular`  | Sản phẩm phổ biến          | `isPopular=true`                      |
| `isNew`      | Sản phẩm mới               | `isNew=true`                          |
| `price[gte]` | Giá >= giá trị             | `price[gte]=20000`                    |
| `price[lte]` | Giá <= giá trị             | `price[lte]=50000`                    |
| `price[gt]`  | Giá > giá trị              | `price[gt]=10000`                     |
| `price[lt]`  | Giá < giá trị              | `price[lt]=100000`                    |
| `status[in]` | Trạng thái trong danh sách | `status[in]=available,out_of_stock`   |

#### Ví dụ Requests

**1. Lấy trang 1, mỗi trang 10 items:**

```
GET /api/products?page=1&limit=10
```

**2. Tìm kiếm sản phẩm có từ "cơm":**

```
GET /api/products?search=cơm&page=1&limit=10
```

**3. Lọc sản phẩm available, sắp xếp theo giá giảm dần:**

```
GET /api/products?status=available&sort=-price
```

**4. Lọc sản phẩm theo khoảng giá 20k-50k:**

```
GET /api/products?price[gte]=20000&price[lte]=50000
```

**5. Chỉ lấy name, price và image:**

```
GET /api/products?fields=name,price,image&limit=20
```

**6. Sản phẩm phổ biến, mới nhất trước:**

```
GET /api/products?isPopular=true&sort=-createdAt
```

**7. Kết hợp nhiều filter:**

```
GET /api/products?categoryId=507f1f77bcf86cd799439011&status=available&price[lte]=50000&sort=-createdAt&page=1&limit=20
```

#### Response Format

```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm thành công",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Cơm sườn",
      "slug": "com-suon",
      "price": 35000,
      "originalPrice": 40000,
      "status": "available",
      "description": "Cơm sườn nướng thơm ngon",
      "image": "https://...",
      "calories": 650,
      "preparationTime": 15,
      "isPopular": true,
      "stockQuantity": 50,
      "categoryId": {
        "_id": "507f...",
        "name": "Cơm"
      },
      "canteenId": {
        "_id": "507f...",
        "name": "Canteen A",
        "location": "Khu A, Tầng 1"
      },
      "createdAt": "2026-01-22T00:00:00.000Z",
      "updatedAt": "2026-01-22T00:00:00.000Z"
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

### 2. Lấy sản phẩm theo căng tin

```
GET /api/products/canteen/:canteenId
```

Hỗ trợ tất cả query parameters giống như endpoint trên, nhưng tự động lọc theo `canteenId` và chỉ lấy sản phẩm `available`.

#### Ví dụ:

```
GET /api/products/canteen/507f1f77bcf86cd799439011?page=1&limit=10&sort=-price
```

### 3. Lấy chi tiết một sản phẩm

```
GET /api/products/:id
```

Response không có pagination, chỉ trả về thông tin chi tiết của 1 sản phẩm.

---

## Các trường hợp sử dụng phổ biến

### 1. Hiển thị danh sách sản phẩm cho khách hàng

```javascript
// Frontend code example
const fetchProducts = async (page = 1) => {
  const response = await fetch(
    `/api/products?page=${page}&limit=12&status=available&sort=-isPopular,-createdAt`,
  );
  const data = await response.json();
  return data;
};
```

### 2. Tìm kiếm sản phẩm

```javascript
const searchProducts = async (keyword, page = 1) => {
  const response = await fetch(
    `/api/products?search=${encodeURIComponent(keyword)}&page=${page}&limit=10`,
  );
  const data = await response.json();
  return data;
};
```

### 3. Lọc sản phẩm theo danh mục

```javascript
const getProductsByCategory = async (categoryId, page = 1) => {
  const response = await fetch(
    `/api/products?categoryId=${categoryId}&status=available&page=${page}&limit=12`,
  );
  const data = await response.json();
  return data;
};
```

### 4. Hiển thị menu căng tin

```javascript
const getCanteenMenu = async (canteenId, page = 1) => {
  const response = await fetch(
    `/api/products/canteen/${canteenId}?page=${page}&limit=20&sort=name`,
  );
  const data = await response.json();
  return data;
};
```

---

## Tips & Best Practices

1. **Luôn kiểm tra `pagination.hasNextPage`** trước khi tải trang tiếp theo
2. **Sử dụng `limit` phù hợp**:
   - Mobile: 10-15 items
   - Desktop: 20-30 items
   - Grid layout: Số chia hết cho số cột
3. **Cache dữ liệu** để giảm số lần gọi API
4. **Kết hợp filters** để tối ưu trải nghiệm người dùng
5. **Sử dụng `fields`** để giảm dung lượng response khi chỉ cần một số trường

---

## Error Responses

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
