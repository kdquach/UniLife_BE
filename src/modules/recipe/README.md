# Recipe Module

Module quản lý công thức chế biến món ăn (Recipe) - định nghĩa nguyên liệu cần thiết cho từng sản phẩm.

## 📁 Cấu trúc

```
src/modules/recipe/
├── recipe.model.js      # Recipe Schema & Model
├── recipe.service.js    # Business Logic
├── recipe.controller.js # Request Handlers
└── recipe.routes.js     # API Routes
```

## 🔗 Quan hệ

```
Product (1) ←→ (N) Recipe (N) ←→ (1) Ingredient
```

## 📊 Schema

```javascript
{
  productId: ObjectId (ref: Product),
  ingredientId: ObjectId (ref: Ingredient),
  quantity: Number,
  unit: String,
  description: String,
  isRequired: Boolean,
  order: Number,
  timestamps: true
}
```

## 🛣️ API Endpoints

### Base URL: `/api/recipes`

| Method | Endpoint                             | Description                     | Auth           |
| ------ | ------------------------------------ | ------------------------------- | -------------- |
| POST   | `/`                                  | Thêm nguyên liệu vào công thức  | Staff, Manager |
| POST   | `/batch`                             | Thêm nhiều nguyên liệu cùng lúc | Staff, Manager |
| POST   | `/clone`                             | Sao chép công thức từ món khác  | Staff, Manager |
| GET    | `/product/:productId`                | Lấy công thức theo món ăn       | Staff, Manager |
| GET    | `/product/:productId/check`          | Kiểm tra nguyên liệu có đủ      | Staff, Manager |
| GET    | `/ingredient/:ingredientId/products` | Lấy món ăn dùng nguyên liệu     | Staff, Manager |
| PATCH  | `/:id`                               | Cập nhật công thức              | Staff, Manager |
| DELETE | `/:id`                               | Xóa nguyên liệu khỏi công thức  | Staff, Manager |

## 📝 Usage Examples

### 1. Thêm nguyên liệu vào công thức

```javascript
POST /api/recipes
{
  "productId": "648abc123...",
  "ingredientId": "649def456...",
  "quantity": 200,
  "unit": "g",
  "description": "Thái lát mỏng",
  "order": 1
}
```

### 2. Batch thêm nhiều nguyên liệu

```javascript
POST /api/recipes/batch
{
  "productId": "648abc123...",
  "ingredients": [
    {
      "ingredientId": "649def456...",
      "quantity": 200,
      "description": "Thịt bò",
      "order": 1
    },
    {
      "ingredientId": "649ghi789...",
      "quantity": 150,
      "description": "Bánh phở",
      "order": 2
    }
  ]
}
```

### 3. Kiểm tra nguyên liệu có đủ

```javascript
GET /api/recipes/product/648abc123.../check?quantity=5

Response:
{
  "isAvailable": false,
  "insufficientIngredients": [
    {
      "ingredientName": "Thịt bò",
      "required": 1000,
      "available": 500,
      "shortage": 500
    }
  ]
}
```

### 4. Sao chép công thức

```javascript
POST /api/recipes/clone
{
  "fromProductId": "648abc123...",
  "toProductId": "648xyz789..."
}
```

## 🔧 Model Methods

### Static Methods

- `getRecipeByProduct(productId)` - Lấy công thức theo món ăn
- `getProductsByIngredient(ingredientId)` - Lấy món ăn dùng nguyên liệu
- `checkIngredientsAvailable(productId, quantity)` - Kiểm tra nguyên liệu đủ không

### Pre-save Hook

- Tự động validate Product và Ingredient tồn tại
- Tự động lấy `unit` từ Ingredient nếu chưa có

## 🔐 Authorization

Tất cả routes yêu cầu:

- Authentication: `protect` middleware
- Role: `admin`, `staff`, hoặc `manager`

## 🔄 Integration

### Với Product Module

```javascript
// Khi xóa Product, tự động xóa các Recipe liên quan
import { deleteRecipesByProduct } from '../recipe/recipe.service.js';
await deleteRecipesByProduct(productId);
```

### Với Ingredient Module

```javascript
// Khi xóa Ingredient, tự động xóa các Recipe liên quan
import { deleteRecipesByIngredient } from '../recipe/recipe.service.js';
await deleteRecipesByIngredient(ingredientId);
```

## ⚠️ Notes

- Mỗi cặp (productId, ingredientId) chỉ tồn tại 1 bản ghi (unique index)
- Field `order` dùng để sắp xếp thứ tự hiển thị nguyên liệu
- Field `isRequired` đánh dấu nguyên liệu bắt buộc/tùy chọn
- Tự động populate thông tin Product và Ingredient khi query
