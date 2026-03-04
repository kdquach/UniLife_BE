# 🧪 Test Scenarios - Bảng lương

## 📋 Dữ liệu test đã seed

### 👥 Nhân viên (5 người)

| Tên          | Email           | Lương giờ | Config                         |
| ------------ | --------------- | --------- | ------------------------------ |
| Nguyễn Văn A | staff1@test.com | 80,000đ   | Senior - thưởng cao, phạt nặng |
| Trần Thị B   | staff2@test.com | 60,000đ   | Trung cấp                      |
| Lê Văn C     | staff3@test.com | 50,000đ   | Mới - mức cơ bản               |
| Phạm Thị D   | staff4@test.com | 45,000đ   | Part-time                      |
| Hoàng Văn E  | staff5@test.com | 40,000đ   | Thử việc                       |

### 📅 Dữ liệu chấm công

- **Tháng 1/2026:** ~145 ca làm việc (đầy đủ)
- **Tháng 2/2026:** ~139 ca làm việc (đầy đủ)
- **Tháng 3/2026:** ~21 ca làm việc (đến ngày 04/03)

### 🎭 Mẫu chấm công random

- 70% đúng giờ
- 10% làm overtime
- 10% đi muộn
- 5% về sớm
- 5% nghỉ không phép

---

## 🎯 Test Case 1: Tạo bảng lương cả tháng

### Mục tiêu

Tạo bảng lương cho toàn bộ tháng

### Bước thực hiện

1. Đăng nhập: `manager@test.com` / `123456`
2. Vào **Quản lý bảng lương**
3. Click **Tạo bảng lương**
4. Chọn kỳ: `01/01/2026` - `31/01/2026`
5. Click **Tạo bảng lương**

### Kết quả mong đợi

✅ Tạo thành công với:

- 5 nhân viên
- Tổng ~145 ca làm việc
- Lương tính theo mức lương cá nhân
- Thưởng chuyên cần tự động
- Khấu trừ đi muộn/vắng tự động

### Kiểm tra chi tiết

- Nhấn vào bảng lương vừa tạo
- Xem cột "Lương giờ" khác nhau theo từng NV
- Check "Thưởng" và "Khấu trừ" có giá trị
- Xem "Ghi chú" có thông tin thưởng/phạt

---

## 🎯 Test Case 2: Tạo nhiều kỳ lương trong 1 tháng

### Mục tiêu

Tạo 2 kỳ lương riêng cho nửa đầu và nửa cuối tháng 2

### Bước thực hiện

**Kỳ 1 - Nửa đầu tháng:**

1. Tạo bảng lương
2. Chọn kỳ: `01/02/2026` - `15/02/2026`
3. Tạo thành công ✅

**Kỳ 2 - Nửa cuối tháng:**

1. Tạo bảng lương
2. Chọn kỳ: `16/02/2026` - `28/02/2026`
3. Tạo thành công ✅

### Kết quả mong đợi

✅ Cả 2 kỳ đều tạo được
✅ Không báo lỗi trùng lặp
✅ Mỗi kỳ có số ca khác nhau
✅ Tổng 2 kỳ = tổng ca trong tháng

### Kiểm tra

```
Kỳ 1: ~70 ca (01-15/02)
Kỳ 2: ~69 ca (16-28/02)
Tổng: ~139 ca (cả tháng 2)
```

---

## 🎯 Test Case 3: Tạo trùng kỳ (Negative test)

### Mục tiêu

Kiểm tra hệ thống ngăn chặn tạo trùng kỳ

### Bước thực hiện

1. Tạo kỳ: `01/02/2026` - `28/02/2026` → Thành công
2. Tạo lại kỳ: `01/02/2026` - `28/02/2026` → Phải báo lỗi

### Kết quả mong đợi

❌ Báo lỗi: "Kỳ lương này đã tồn tại cho canteen này"

---

## 🎯 Test Case 4: Xem chi tiết và điều chỉnh lương

### Mục tiêu

Xem chi tiết cấu hình SalaryRate và điều chỉnh lương NV

### Bước thực hiện

1. Tạo bảng lương tháng 2
2. Nhấn vào bảng lương → Xem chi tiết
3. Tìm nhân viên **Nguyễn Văn A**
4. Nhấn nút **Điều chỉnh**

### Kết quả mong đợi - Hiển thị trong Dialog

**Phần 1 - Thông tin nhân viên:**

```
Nhân viên: Nguyễn Văn A (staff1@test.com)
Số giờ: ~120 giờ
Lương cơ bản: ~9,600,000đ (120h × 80,000đ)
Thưởng hiện tại: +xxx đ
Khấu trừ hiện tại: -xxx đ
```

**Phần 2 - Cấu hình SalaryRate:**

```
┌─────────────────────────────────────┐
│ Lương giờ:           80,000đ/h      │
│ Hiệu lực từ:         01/01/2026     │
│ Thưởng CC 100%:      1,000,000đ     │
│ Thưởng CC 95%:       600,000đ       │
│ Thưởng CC 90%:       300,000đ       │
│ Hệ số làm thêm:      x2.0           │
│ Phạt đi muộn:        100,000đ/lần   │
│ Phạt về sớm:         50,000đ/lần    │
│ Phạt vắng:           300,000đ/lần   │
│ Số lần muộn tối đa:  2 lần          │
└─────────────────────────────────────┘
```

**Phần 3 - Điều chỉnh:**

- Chọn loại: **Thưởng thêm**
- Số tiền: `500,000`
- Lý do: "Hoàn thành xuất sắc KPI tháng 2"
- Preview: Tổng lương mới = Lương cũ + 500,000đ

### Thao tác

1. Nhập đầy đủ thông tin
2. Click **Lưu thay đổi**
3. Refresh → Kiểm tra thưởng đã cập nhật

---

## 🎯 Test Case 5: So sánh lương giờ giữa các nhân viên

### Mục tiêu

Kiểm tra hệ thống tính đúng lương giờ khác nhau

### Bước thực hiện

1. Tạo bảng lương tháng 1
2. Xem chi tiết
3. So sánh cột "Lương giờ" của 5 nhân viên

### Kết quả mong đợi

| Nhân viên    | Lương giờ | Số giờ | Lương cơ bản |
| ------------ | --------- | ------ | ------------ |
| Nguyễn Văn A | 80,000đ/h | ~120h  | ~9,600,000đ  |
| Trần Thị B   | 60,000đ/h | ~120h  | ~7,200,000đ  |
| Lê Văn C     | 50,000đ/h | ~120h  | ~6,000,000đ  |
| Phạm Thị D   | 45,000đ/h | ~120h  | ~5,400,000đ  |
| Hoàng Văn E  | 40,000đ/h | ~120h  | ~4,800,000đ  |

**Công thức:** Lương cơ bản = Số giờ × Lương giờ

---

## 🎯 Test Case 6: Kiểm tra thưởng chuyên cần

### Mục tiêu

Xác minh thưởng chuyên cần được tính đúng

### Tìm nhân viên có 100% chuyên cần

1. Xem thống kê ở terminal sau khi seed
2. Tìm NV có 0 muộn, 0 vắng trong tháng
3. Ví dụ: **Lê Văn C** - Tháng 2: 28 ca (0 muộn, 0 vắng)

### Bước kiểm tra

1. Tạo bảng lương tháng 2
2. Xem chi tiết lương của **Lê Văn C**
3. Check thưởng

### Kết quả mong đợi

✅ Thưởng chuyên cần 100% = `500,000đ` (theo SalaryRate config)

### Xem trong Dialog điều chỉnh

- Phần "Ghi chú" có: "Thưởng: Chuyên cần 100%..."

---

## 🎯 Test Case 7: Kiểm tra phạt đi muộn

### Mục tiêu

Xác minh phạt đi muộn được tính đúng

### Tìm nhân viên đi muộn nhiều

1. Xem thống kê: Tìm NV có > 2 lần muộn
2. Ví dụ: **Trần Thị B** - Tháng 1: 3 muộn

### Bước kiểm tra

1. Tạo bảng lương tháng 1
2. Xem chi tiết lương của **Trần Thị B**
3. Check khấu trừ

### Kết quả mong đợi

✅ Khấu trừ đi muộn = `3 lần × 70,000đ = 210,000đ`

---

## 🎯 Test Case 8: Kiểm tra phạt vắng không phép

### Mục tiêu

Xác minh phạt vắng được tính đúng

### Tìm nhân viên vắng

1. Xem thống kê: Tìm NV có vắng
2. Ví dụ: **Hoàng Văn E** - Tháng 1: 3 vắng

### Bước kiểm tra

1. Tạo bảng lương tháng 1
2. Xem chi tiết lương của **Hoàng Văn E**
3. Check khấu trừ

### Kết quả mong đợi

✅ Khấu trừ vắng = `3 lần × 100,000đ = 300,000đ` (theo config)

---

## 🎯 Test Case 9: Tạo kỳ lương theo tuần

### Mục tiêu

Tạo bảng lương theo từng tuần trong tháng

### Bước thực hiện

**Tuần 1:**

- Kỳ: `01/02/2026` - `07/02/2026`

**Tuần 2:**

- Kỳ: `08/02/2026` - `14/02/2026`

**Tuần 3:**

- Kỳ: `15/02/2026` - `21/02/2026`

**Tuần 4:**

- Kỳ: `22/02/2026` - `28/02/2026`

### Kết quả mong đợi

✅ Tất cả 4 tuần đều tạo được
✅ Không trùng lặp
✅ Tổng 4 tuần = cả tháng

---

## 🎯 Test Case 10: Workflow hoàn chỉnh

### Mục tiêu

Test toàn bộ workflow từ đầu đến cuối

### Bước thực hiện

**1. Tạo bảng lương:**

- Kỳ: Tháng 3 (01/03 - 04/03)
- Status: Đã tính 🔵

**2. Xem chi tiết:**

- Check số liệu đúng
- Xem SalaryRate config

**3. Điều chỉnh lương:**

- Chọn 1 nhân viên
- Thưởng thêm: 200,000đ
- Lý do: "Test điều chỉnh"
- Lưu

**4. Duyệt kỳ lương:**

- Click "Duyệt kỳ lương"
- Xác nhận
- Status: Đã duyệt 🟢
- Không thể chỉnh sửa nữa

**5. Xác nhận thanh toán:**

- Click "Xác nhận thanh toán"
- Xác nhận
- Status: Đã thanh toán ✅

### Kết quả mong đợi

✅ Workflow hoàn chỉnh không lỗi
✅ Mỗi bước chuyển trạng thái đúng
✅ Không thể sửa sau khi duyệt

---

## 🎯 Test Case 11: Tạo kỳ không có dữ liệu

### Mục tiêu

Test tạo kỳ lương khi không có ca làm việc

### Bước thực hiện

1. Tạo kỳ: `01/04/2026` - `30/04/2026` (tháng 4 chưa có data)

### Kết quả mong đợi

⚠️ Có thể:

- Tạo thành công nhưng 0 nhân viên
- Hoặc báo lỗi không có dữ liệu

---

## 🎯 Test Case 12: Xóa bảng lương

### Mục tiêu

Xóa kỳ lương đang ở trạng thái draft/calculated

### Bước thực hiện

1. Tạo kỳ lương mới (trạng thái: Đã tính)
2. Vào chi tiết
3. Click "Xóa"
4. Xác nhận

### Kết quả mong đợi

✅ Xóa thành công
✅ Redirect về danh sách
✅ Kỳ lương không còn trong danh sách

### Negative test

1. Duyệt kỳ lương (trạng thái: Đã duyệt)
2. Nút "Xóa" phải ẩn hoặc disabled

---

## 📊 Checklist tổng quan

### Frontend

- [ ] Dialog tạo bảng lương hiển thị đúng
- [ ] Không cần nhập hourlyRate
- [ ] Hướng dẫn rõ ràng
- [ ] Danh sách bảng lương hiển thị
- [ ] Filter theo trạng thái/tháng hoạt động
- [ ] Chi tiết hiển thị đầy đủ thông tin
- [ ] Cột "Lương giờ" hiển thị đúng
- [ ] Dialog điều chỉnh hiển thị SalaryRate config
- [ ] Form điều chỉnh validation đúng
- [ ] Preview tổng lương chính xác
- [ ] Duyệt/Thanh toán chuyển trạng thái
- [ ] Không sửa được sau khi duyệt
- [ ] Xóa chỉ với draft/calculated

### Backend

- [ ] API generate payroll hoạt động
- [ ] Tính lương theo SalaryRate cá nhân
- [ ] Thưởng chuyên cần tự động
- [ ] Thưởng overtime tự động
- [ ] Phạt đi muộn/về sớm/vắng tự động
- [ ] Kiểm tra trùng kỳ lương
- [ ] Cho phép nhiều kỳ khác nhau
- [ ] API điều chỉnh lương hoạt động
- [ ] Workflow duyệt/thanh toán đúng
- [ ] Không sửa được khi đã duyệt

### Database

- [ ] SalaryRate đã seed đầy đủ
- [ ] StaffShift có dữ liệu 3 tháng
- [ ] Payroll tạo đúng cấu trúc
- [ ] Salary records liên kết đúng
- [ ] Indexes hoạt động

---

## 🚀 Quick Test Commands

```bash
# Seed lại dữ liệu
node src/scripts/seed-payroll-test-data.js

# Seed dữ liệu đầy đủ
node src/scripts/seed-full.js

# Kiểm tra dữ liệu trong DB
mongosh "mongodb+srv://..." --eval "db.staffshifts.countDocuments()"
```

---

## 💡 Tips khi test

1. **Seed nhiều lần:** Mỗi lần seed tạo pattern random khác nhau
2. **So sánh terminal vs UI:** Số liệu phải khớp
3. **Test edge cases:** 0 giờ, 0 thưởng, 0 phạt
4. **Test với nhiều canteen:** Nếu có
5. **Test permission:** Staff chỉ xem lương mình
6. **Test responsive:** Mobile/Tablet
7. **Test performance:** Bảng lương với nhiều nhân viên

---

**Cập nhật:** 04/03/2026  
**Version:** 1.0
