# HƯỚNG DẪN TEST API ĐỔI MẬT KHẨU

## Chuẩn bị

### 1. Khởi động server

```bash
cd d:\Tai_lieu_ca_nhan\Ky_8\WDP301\SourceCode\UniLife_BE
npm run dev
```

### 2. Cài đặt công cụ test

Bạn có thể sử dụng một trong các công cụ sau:

- **Postman** (khuyên dùng)
- **Thunder Client** (extension trong VS Code)
- **cURL** (command line)
- **REST Client** (extension trong VS Code)

---

## HƯỚNG DẪN TEST BẰNG POSTMAN

### Bước 1: Import Collection (Tùy chọn)

Hoặc tạo request thủ công theo hướng dẫn dưới đây.

### Bước 2: Đăng nhập để lấy Token

1. Tạo request mới trong Postman
2. Cấu hình:
   - **Method**: POST
   - **URL**: `http://localhost:5000/api/auth/login`
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body** (chọn raw - JSON):
     ```json
     {
       "email": "user@example.com",
       "password": "password123"
     }
     ```

3. Click **Send**
4. Trong response, copy giá trị của `token`:
   ```json
   {
     "status": "success",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "data": { ... }
   }
   ```

### Bước 3: Test API Đổi Mật Khẩu

#### Test Case 1: ✅ Đổi mật khẩu thành công

1. Tạo request mới
2. Cấu hình:
   - **Method**: POST
   - **URL**: `http://localhost:5000/api/auth/change-password`
   - **Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
     _(Thay token bằng token bạn vừa copy)_
   - **Body** (chọn raw - JSON):
     ```json
     {
       "currentPassword": "password123",
       "newPassword": "newPassword456",
       "confirmPassword": "newPassword456"
     }
     ```

3. Click **Send**
4. **Kết quả mong đợi** (Status: 200 OK):
   ```json
   {
     "status": "success",
     "message": "Đổi mật khẩu thành công"
   }
   ```

#### Test Case 2: ❌ Mật khẩu xác nhận không khớp

**Body**:

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456",
  "confirmPassword": "differentPassword"
}
```

**Kết quả mong đợi** (Status: 400):

```json
{
  "status": "error",
  "message": "Mật khẩu mới và xác nhận mật khẩu không khớp"
}
```

#### Test Case 3: ❌ Mật khẩu hiện tại sai

**Body**:

```json
{
  "currentPassword": "wrongPassword",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

**Kết quả mong đợi** (Status: 401):

```json
{
  "status": "error",
  "message": "Mật khẩu hiện tại không đúng"
}
```

#### Test Case 4: ❌ Mật khẩu mới trùng với cũ

**Body**:

```json
{
  "currentPassword": "password123",
  "newPassword": "password123",
  "confirmPassword": "password123"
}
```

**Kết quả mong đợi** (Status: 400):

```json
{
  "status": "error",
  "message": "Mật khẩu mới phải khác với mật khẩu hiện tại"
}
```

#### Test Case 5: ❌ Mật khẩu quá ngắn

**Body**:

```json
{
  "currentPassword": "password123",
  "newPassword": "123",
  "confirmPassword": "123"
}
```

**Kết quả mong đợi** (Status: 400):

```json
{
  "status": "error",
  "message": "Mật khẩu mới phải có ít nhất 6 ký tự"
}
```

#### Test Case 6: ❌ Thiếu trường bắt buộc

**Body**:

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
}
```

**Kết quả mong đợi** (Status: 400):

```json
{
  "status": "error",
  "message": "Vui lòng cung cấp đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu"
}
```

#### Test Case 7: ❌ Không có token

**Headers** (bỏ Authorization header):

```
Content-Type: application/json
```

**Kết quả mong đợi** (Status: 401):

```json
{
  "status": "error",
  "message": "You are not logged in. Please log in to access."
}
```

---

## HƯỚNG DẪN TEST BẰNG THUNDER CLIENT (VS Code)

### Bước 1: Cài đặt Thunder Client

1. Mở VS Code
2. Vào Extensions (Ctrl+Shift+X)
3. Tìm "Thunder Client"
4. Click Install

### Bước 2: Tạo Request

1. Click vào icon Thunder Client ở sidebar
2. Click "New Request"
3. Làm theo các bước tương tự Postman ở trên

### Tips cho Thunder Client:

- Bạn có thể lưu token vào Environment Variables để tái sử dụng
- Tạo Collection để quản lý các request

---

## HƯỚNG DẪN TEST BẰNG cURL

### 1. Đăng nhập

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
```

### 2. Đổi mật khẩu (thay YOUR_TOKEN)

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"currentPassword\":\"password123\",\"newPassword\":\"newPassword456\",\"confirmPassword\":\"newPassword456\"}"
```

---

## HƯỚNG DẪN TEST BẰNG REST CLIENT (VS Code Extension)

### Bước 1: Cài đặt REST Client

1. Mở VS Code Extensions
2. Tìm "REST Client" by Huachao Mao
3. Install

### Bước 2: Tạo file test

Tạo file `test-change-password.http` trong thư mục `docs/`:

```http
### Đăng nhập
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

### Lưu token từ response ở trên, sau đó test đổi mật khẩu

### Test Case 1: Đổi mật khẩu thành công
POST http://localhost:5000/api/auth/change-password
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "currentPassword": "password123",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}

### Test Case 2: Mật khẩu xác nhận không khớp
POST http://localhost:5000/api/auth/change-password
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "currentPassword": "password123",
  "newPassword": "newPassword456",
  "confirmPassword": "differentPassword"
}

### Test Case 3: Mật khẩu hiện tại sai
POST http://localhost:5000/api/auth/change-password
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "currentPassword": "wrongPassword",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}
```

### Bước 3: Chạy request

- Click vào "Send Request" phía trên mỗi request
- Hoặc sử dụng shortcut: `Ctrl+Alt+R` (Windows) / `Cmd+Alt+R` (Mac)

---

## CHECKLIST TEST

Đánh dấu ✅ khi đã test xong:

- [ ] Test Case 1: Đổi mật khẩu thành công
- [ ] Test Case 2: Mật khẩu xác nhận không khớp
- [ ] Test Case 3: Mật khẩu hiện tại sai
- [ ] Test Case 4: Mật khẩu mới trùng với cũ
- [ ] Test Case 5: Mật khẩu quá ngắn
- [ ] Test Case 6: Thiếu trường bắt buộc
- [ ] Test Case 7: Không có token
- [ ] Test Case 8: Token không hợp lệ
- [ ] Test Case 9: Kiểm tra đăng nhập lại sau khi đổi mật khẩu

---

## LƯU Ý QUAN TRỌNG

### ⚠️ Trước khi test:

1. Đảm bảo server đang chạy (`npm run dev`)
2. Đảm bảo database đã kết nối
3. Đã có tài khoản để test (có thể tạo qua API register)

### ⚠️ Sau khi đổi mật khẩu thành công:

1. Token cũ vẫn còn hiệu lực (chưa implement logout all sessions)
2. Phải dùng mật khẩu mới để đăng nhập lần sau
3. Kiểm tra bằng cách logout và login lại với mật khẩu mới

### ⚠️ Debugging:

Nếu gặp lỗi, check:

1. Console log của server
2. Response body từ API
3. Network tab trong browser DevTools
4. MongoDB có dữ liệu user chưa

---

## BONUS: Tạo User Test (Nếu chưa có)

### Đăng ký user mới:

```bash
# Request
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "0123456789"
}
```

Sau đó dùng email `test@example.com` và password `password123` để test API đổi mật khẩu.

---

## KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành tất cả test cases:

- ✅ Tất cả các case đều trả về đúng status code
- ✅ Message lỗi rõ ràng, dễ hiểu
- ✅ Đổi mật khẩu thành công
- ✅ Đăng nhập được với mật khẩu mới
- ✅ Không đăng nhập được với mật khẩu cũ

---

## HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:

1. File log trong thư mục `logs/`
2. Console output của server
3. Đọc kỹ error message từ response
4. Xem file [CHANGE_PASSWORD_API.md](./CHANGE_PASSWORD_API.md) để biết thêm chi tiết
