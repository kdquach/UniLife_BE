# Quick Reference - Test Module Quản lý Lương

## 🚀 Đã thực hiện

✅ Tạo 5 nhân viên test với mức lương khác nhau  
✅ Tạo 4 ca làm việc (Sáng, Trưa, Chiều, Tối)  
✅ Tạo 150 ca làm tháng 01/2026  
✅ Tạo 139 ca làm tháng 02/2026  
✅ Cấu hình SalaryRate riêng cho từng nhân viên

## 👥 Tài khoản test

| Loại    | Email            | Password | Vai trò                |
| ------- | ---------------- | -------- | ---------------------- |
| Manager | manager@test.com | 123456   | Quản lý canteen        |
| Staff 1 | staff1@test.com  | 123456   | Nguyễn Văn A (Senior)  |
| Staff 2 | staff2@test.com  | 123456   | Trần Thị B (Trung cấp) |
| Staff 3 | staff3@test.com  | 123456   | Lê Văn C (Mới)         |
| Staff 4 | staff4@test.com  | 123456   | Phạm Thị D (Part-time) |
| Staff 5 | staff5@test.com  | 123456   | Hoàng Văn E (Thử việc) |

## 💰 Mức lương

| Nhân viên    | Lương giờ | Thưởng 100% | Phạt muộn | Cho phép muộn |
| ------------ | --------- | ----------- | --------- | ------------- |
| Nguyễn Văn A | 80,000đ   | 1,000,000đ  | 100,000đ  | 2 lần         |
| Trần Thị B   | 60,000đ   | 700,000đ    | 70,000đ   | 3 lần         |
| Lê Văn C     | 50,000đ   | 500,000đ    | 50,000đ   | 3 lần         |
| Phạm Thị D   | 45,000đ   | 400,000đ    | 40,000đ   | 2 lần         |
| Hoàng Văn E  | 40,000đ   | 300,000đ    | 30,000đ   | 1 lần         |

## 🧪 Test Cases

### Test 1: Tạo bảng lương tháng 1/2026

```
1. Login: manager@test.com / 123456
2. Menu: Quản lý lương > Bảng lương
3. Click: "Tạo bảng lương mới"
4. Nhập:
   - Từ ngày: 01/01/2026
   - Đến ngày: 31/01/2026
5. Click: "Tạo bảng lương"
6. Kiểm tra:
   ✓ 5 nhân viên hiển thị
   ✓ Tổng giờ làm
   ✓ Tổng lương
   ✓ Tổng thưởng
   ✓ Tổng khấu trừ
```

### Test 2: Xem chi tiết lương Nguyễn Văn A

```
1. Click vào payroll vừa tạo
2. Tìm dòng "Nguyễn Văn A"
3. Click "Xem chi tiết"
4. Kiểm tra:
   ✓ Số ca: 32 ca
   ✓ Đi muộn: 3 lần (vượt ngưỡng 2)
   ✓ Nghỉ KP: 3 ca
   ✓ Lương cơ bản = giờ × 80,000đ
   ✓ KHÔNG có thưởng chuyên cần (vì muộn > 2)
   ✓ Phạt muộn: 3 × 100,000đ = 300,000đ
   ✓ Phạt nghỉ: 3 × 300,000đ = 900,000đ
```

### Test 3: Sửa cấu hình lương

```
1. Menu: Quản lý lương > Cấu hình lương
2. Click "Sửa" ở dòng Nguyễn Văn A
3. Thay đổi:
   - Lương giờ: 80,000đ → 100,000đ
   - Thưởng 100%: 1,000,000đ → 1,500,000đ
4. Lưu
5. Tạo payroll mới tháng 3/2026
6. Kiểm tra: Lương mới được áp dụng
```

### Test 4: So sánh 2 tháng

```
1. Tạo payroll tháng 1/2026
2. Tạo payroll tháng 2/2026
3. So sánh:
   ✓ Tháng 2 ít nghỉ KP hơn
   ✓ Tháng 2 nhiều overtime hơn
   ✓ Tổng lương khác nhau
```

## 📊 Kết quả mong đợi

### Tháng 01/2026

| Nhân viên    | Số ca | Muộn | Vắng | Lương dự kiến |
| ------------ | ----- | ---- | ---- | ------------- |
| Nguyễn Văn A | 32    | 3    | 3    | ~8-10 triệu   |
| Trần Thị B   | 36    | 5    | 3    | ~7-9 triệu    |
| Lê Văn C     | 31    | 6    | 0    | ~5-6 triệu    |
| Phạm Thị D   | 29    | 2    | 6    | ~4-5 triệu    |
| Hoàng Văn E  | 22    | 1    | 2    | ~3-4 triệu    |

### Tháng 02/2026

| Nhân viên    | Số ca | Muộn | Vắng | Lương dự kiến |
| ------------ | ----- | ---- | ---- | ------------- |
| Nguyễn Văn A | 26    | 2    | 0    | ~9-11 triệu   |
| Trần Thị B   | 28    | 2    | 2    | ~7-8 triệu    |
| Lê Văn C     | 27    | 5    | 1    | ~5-6 triệu    |
| Phạm Thị D   | 28    | 2    | 0    | ~5-6 triệu    |
| Hoàng Văn E  | 30    | 5    | 0    | ~4-5 triệu    |

**Ghi chú:** Lương thực tế phụ thuộc vào OT và các yếu tố khác

## 🔧 Troubleshooting

### Lỗi: Không load được dữ liệu

**Nguyên nhân:** Backend chưa update roles cho SalaryRate/User routes

**Giải pháp:**

```javascript
// Sửa: UniLife_BE/src/modules/salaryRate/salaryRate.routes.js
router.use(restrictTo("admin", "canteen_owner", "manager"));

// Sửa: UniLife_BE/src/modules/user/user.routes.js
router.get(
  "/",
  restrictTo("admin", "canteen_owner", "manager"),
  userController.getAllUsers,
);
```

### Lỗi: Không tính được thưởng/phạt

**Nguyên nhân:** Calculator chưa được tích hợp

**Giải pháp:** Kiểm tra file:

```
UniLife_BE/src/modules/payroll/payroll.calculator.js
UniLife_BE/src/modules/payroll/payroll.service.js (dòng import calculator)
```

### Lỗi: Seed script fail

**Chạy lại:**

```bash
cd UniLife_BE
node src/scripts/seed-payroll-test-data.js
```

## 📝 Checklist hoàn chỉnh

- [x] Seed dữ liệu thành công
- [ ] Login với manager@test.com
- [ ] Tạo payroll tháng 1/2026
- [ ] Xem chi tiết từng nhân viên
- [ ] Kiểm tra thưởng chuyên cần
- [ ] Kiểm tra phạt đi muộn
- [ ] Kiểm tra phạt nghỉ KP
- [ ] Kiểm tra thưởng overtime
- [ ] Tạo payroll tháng 2/2026
- [ ] So sánh 2 tháng
- [ ] Sửa cấu hình lương
- [ ] Verify cấu hình mới được áp dụng

## 🎯 Mục tiêu test

✅ **Chức năng core:**

- Tạo bảng lương tự động
- Tính toán lương chính xác
- Hiển thị chi tiết lương

✅ **Business logic:**

- Thưởng chuyên cần theo %
- Phạt đi muộn/về sớm/nghỉ
- Thưởng overtime

✅ **Cấu hình:**

- Quản lý SalaryRate
- Áp dụng config riêng từng NV
- Config mới chỉ ảnh hưởng payroll mới

## 🌟 Tips

1. **Xem log chi tiết:** Check Console/Network tab trong browser
2. **Test nhiều scenario:** Thử các trường hợp biên
3. **Verify database:** Dùng MongoDB Compass xem raw data
4. **Compare với document:** Đối chiếu với PAYROLL_CALCULATOR_GUIDE.md
5. **Report bug:** Nếu có vấn đề, note lại steps và expected vs actual

---

**Tài liệu liên quan:**

- [SEED_PAYROLL_TEST_DATA.md](./SEED_PAYROLL_TEST_DATA.md) - Hướng dẫn chi tiết
- [PAYROLL_CALCULATOR_GUIDE.md](./PAYROLL_CALCULATOR_GUIDE.md) - Logic tính lương
- [SALARY_RATE_CONFIG_GUIDE.md](./SALARY_RATE_CONFIG_GUIDE.md) - Cấu hình lương
