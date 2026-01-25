# 🔐 API ĐỔI MẬT KHẨU - TÓM TẮT

## ✅ ĐÃ HOÀN THÀNH

API đổi mật khẩu đã được triển khai thành công với các file sau:

### 📁 Code Files

1. **auth.service.js** - Thêm function `changePassword()`
2. **auth.controller.js** - Thêm controller `changePassword`
3. **auth.routes.js** - Thêm route `POST /api/auth/change-password`

### 📁 Documentation Files

1. **CHANGE_PASSWORD_API.md** - Tài liệu API đầy đủ
2. **CHANGE_PASSWORD_TEST_GUIDE.md** - Hướng dẫn test chi tiết
3. **change-password-test-cases.json** - JSON test cases
4. **test-change-password.http** - File test với REST Client

---

## 🚀 CÁCH SỬ DỤNG NHANH

### 1️⃣ Endpoint

```
POST http://localhost:5000/api/auth/change-password
```

### 2️⃣ Request

```json
{
  "currentPassword": "mật_khẩu_hiện_tại",
  "newPassword": "mật_khẩu_mới",
  "confirmPassword": "mật_khẩu_mới"
}
```

### 3️⃣ Headers

```
Authorization: Bearer <your_token>
Content-Type: application/json
```

### 4️⃣ Response thành công

```json
{
  "status": "success",
  "message": "Đổi mật khẩu thành công"
}
```

---

## 🧪 CÁCH TEST

### Option 1: Sử dụng REST Client (Khuyên dùng - Nhanh nhất)

1. Cài đặt extension "REST Client" trong VS Code
2. Mở file `docs/test-change-password.http`
3. Click "Send Request" để test từng case

### Option 2: Sử dụng Postman

1. Đọc hướng dẫn trong `docs/CHANGE_PASSWORD_TEST_GUIDE.md`
2. Import các test cases từ `docs/change-password-test-cases.json`

### Option 3: Sử dụng cURL

```bash
# Đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Đổi mật khẩu (thay YOUR_TOKEN)
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"currentPassword":"password123","newPassword":"newPassword456","confirmPassword":"newPassword456"}'
```

---

## 🔍 TÍNH NĂNG

✅ **Bảo mật:**

- Yêu cầu xác thực bằng JWT token
- Kiểm tra mật khẩu hiện tại trước khi đổi
- Hash mật khẩu mới tự động

✅ **Validation:**

- Kiểm tra tất cả trường bắt buộc
- Mật khẩu mới phải khác mật khẩu cũ
- Mật khẩu xác nhận phải khớp
- Mật khẩu tối thiểu 6 ký tự

✅ **Error Handling:**

- Thông báo lỗi rõ ràng bằng tiếng Việt
- Mã lỗi HTTP chuẩn
- Xử lý các trường hợp edge cases

---

## 📋 CHECKLIST TEST

- [ ] Test đổi mật khẩu thành công
- [ ] Test mật khẩu xác nhận không khớp
- [ ] Test mật khẩu hiện tại sai
- [ ] Test mật khẩu mới trùng với cũ
- [ ] Test mật khẩu quá ngắn
- [ ] Test thiếu trường bắt buộc
- [ ] Test không có token
- [ ] Test token không hợp lệ
- [ ] Test đăng nhập lại với mật khẩu mới
- [ ] Test không đăng nhập được với mật khẩu cũ

---

## 📚 TÀI LIỆU THAM KHẢO

| File                                                                 | Mô tả                    |
| -------------------------------------------------------------------- | ------------------------ |
| [CHANGE_PASSWORD_API.md](./CHANGE_PASSWORD_API.md)                   | API documentation đầy đủ |
| [CHANGE_PASSWORD_TEST_GUIDE.md](./CHANGE_PASSWORD_TEST_GUIDE.md)     | Hướng dẫn test chi tiết  |
| [change-password-test-cases.json](./change-password-test-cases.json) | JSON test cases          |
| [test-change-password.http](./test-change-password.http)             | REST Client test file    |

---

## ⚠️ LƯU Ý

1. **Tài khoản Google/Facebook:** Người dùng đăng ký qua mạng xã hội không thể đổi mật khẩu
2. **Token:** Cần đăng nhập trước để lấy token
3. **Mật khẩu mới:** Phải khác mật khẩu hiện tại
4. **Bảo mật:** Mật khẩu được hash tự động khi lưu vào database

---

## 🎯 NEXT STEPS (Tùy chọn)

- [ ] Thêm rate limiting để chống brute force
- [ ] Gửi email thông báo khi đổi mật khẩu thành công
- [ ] Logout tất cả sessions khác khi đổi mật khẩu
- [ ] Thêm password strength checker
- [ ] Log lịch sử đổi mật khẩu

---

## 💡 TIPS

- Sử dụng file `.http` để test nhanh ngay trong VS Code
- Kiểm tra console log của server để debug
- Đọc error message kỹ để biết lỗi gì
- Test tất cả các cases để đảm bảo API hoạt động đúng

---

**Chúc bạn test thành công! 🎉**
