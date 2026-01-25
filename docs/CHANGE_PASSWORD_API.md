# API Đổi Mật Khẩu (Change Password)

## Endpoint

```
POST /api/auth/change-password
```

## Yêu cầu xác thực

✅ **Yêu cầu đăng nhập** (Bearer Token)

## Mô tả

API này cho phép người dùng đã đăng nhập đổi mật khẩu của họ. Người dùng cần cung cấp mật khẩu hiện tại để xác thực và mật khẩu mới để cập nhật.

## Headers

```json
{
  "Authorization": "Bearer <your_access_token>",
  "Content-Type": "application/json"
}
```

## Request Body

```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 characters)",
  "confirmPassword": "string (required, must match newPassword)"
}
```

### Tham số

| Tham số         | Kiểu dữ liệu | Bắt buộc | Mô tả                                          |
| --------------- | ------------ | -------- | ---------------------------------------------- |
| currentPassword | string       | ✅       | Mật khẩu hiện tại của người dùng               |
| newPassword     | string       | ✅       | Mật khẩu mới (tối thiểu 6 ký tự)               |
| confirmPassword | string       | ✅       | Xác nhận mật khẩu mới (phải giống newPassword) |

## Response

### Thành công (200 OK)

```json
{
  "status": "success",
  "message": "Đổi mật khẩu thành công"
}
```

### Lỗi

#### 400 Bad Request - Thiếu thông tin

```json
{
  "status": "error",
  "message": "Vui lòng cung cấp đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu"
}
```

#### 400 Bad Request - Mật khẩu không khớp

```json
{
  "status": "error",
  "message": "Mật khẩu mới và xác nhận mật khẩu không khớp"
}
```

#### 400 Bad Request - Mật khẩu trùng lặp

```json
{
  "status": "error",
  "message": "Mật khẩu mới phải khác với mật khẩu hiện tại"
}
```

#### 400 Bad Request - Mật khẩu quá ngắn

```json
{
  "status": "error",
  "message": "Mật khẩu mới phải có ít nhất 6 ký tự"
}
```

#### 400 Bad Request - Tài khoản mạng xã hội

```json
{
  "status": "error",
  "message": "Tài khoản này đăng ký bằng google. Không thể đổi mật khẩu"
}
```

#### 401 Unauthorized - Mật khẩu hiện tại sai

```json
{
  "status": "error",
  "message": "Mật khẩu hiện tại không đúng"
}
```

#### 401 Unauthorized - Chưa đăng nhập

```json
{
  "status": "error",
  "message": "You are not logged in. Please log in to access."
}
```

#### 404 Not Found - Người dùng không tồn tại

```json
{
  "status": "error",
  "message": "Người dùng không tồn tại"
}
```

## Ví dụ sử dụng

### cURL

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456",
    "confirmPassword": "newPassword456"
  }'
```

### Postman / Thunder Client

#### Bước 1: Đăng nhập để lấy token

**Request:**

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "oldPassword123"
}
```

**Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A"
    }
  }
}
```

#### Bước 2: Đổi mật khẩu với token

**Request:**

```
POST http://localhost:5000/api/auth/change-password
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Đổi mật khẩu thành công"
}
```

## Lưu ý quan trọng

1. **Xác thực**: API này yêu cầu người dùng phải đăng nhập. Token JWT phải được gửi kèm trong header `Authorization`.

2. **Tài khoản mạng xã hội**: Người dùng đăng ký qua Google/Facebook không thể đổi mật khẩu vì họ không có mật khẩu trong hệ thống.

3. **Bảo mật**:
   - Mật khẩu hiện tại phải chính xác
   - Mật khẩu mới phải khác mật khẩu hiện tại
   - Mật khẩu được hash tự động bởi middleware của Mongoose

4. **Độ dài mật khẩu**: Mật khẩu mới phải có ít nhất 6 ký tự.

5. **Validation**: Hệ thống kiểm tra:
   - Tất cả các trường bắt buộc phải có giá trị
   - Mật khẩu mới và xác nhận phải khớp nhau
   - Mật khẩu mới phải khác mật khẩu cũ
   - Độ dài mật khẩu hợp lệ

## Luồng hoạt động

```
1. Client gửi request với token + thông tin mật khẩu
   ↓
2. Middleware auth.middleware.js xác thực token
   ↓
3. Lấy userId từ token đã xác thực
   ↓
4. Validate dữ liệu đầu vào
   ↓
5. Kiểm tra user có tồn tại không
   ↓
6. Kiểm tra user có dùng local auth không
   ↓
7. So sánh mật khẩu hiện tại với DB
   ↓
8. Cập nhật mật khẩu mới (tự động hash)
   ↓
9. Trả về kết quả thành công
```

## Test Cases

### Test Case 1: Đổi mật khẩu thành công ✅

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

### Test Case 2: Mật khẩu xác nhận không khớp ❌

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456",
  "confirmPassword": "differentPassword789"
}
```

### Test Case 3: Mật khẩu hiện tại sai ❌

```json
{
  "currentPassword": "wrongPassword",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

### Test Case 4: Mật khẩu mới trùng với cũ ❌

```json
{
  "currentPassword": "password123",
  "newPassword": "password123",
  "confirmPassword": "password123"
}
```

### Test Case 5: Mật khẩu quá ngắn ❌

```json
{
  "currentPassword": "password123",
  "newPassword": "123",
  "confirmPassword": "123"
}
```

### Test Case 6: Thiếu token xác thực ❌

```
Không gửi header Authorization
```

### Test Case 7: Token không hợp lệ ❌

```
Authorization: Bearer invalid_token
```
