# Hướng dẫn Seed dữ liệu Test cho Module Quản lý Lương

## 📋 Mục đích

File seed này tạo dữ liệu test đầy đủ để kiểm tra module quản lý lương, bao gồm:

- ✅ 5 nhân viên với các cấu hình lương khác nhau
- ✅ 4 ca làm việc (sáng, trưa, chiều, tối)
- ✅ Dữ liệu chấm công 2 tháng (01/2026 và 02/2026)
- ✅ Cấu hình SalaryRate chi tiết cho từng nhân viên
- ✅ Các trường hợp: đúng giờ, đi muộn, về sớm, nghỉ không phép, overtime

## 🚀 Cách chạy

### 1. Chạy script seed

```bash
cd UniLife_BE
node src/scripts/seed-payroll-test-data.js
```

### 2. Output mong đợi

```
🔌 Kết nối MongoDB...
✅ Đã kết nối MongoDB

📦 Lấy dữ liệu cơ bản...
✅ Canteen: Canteen ABC (...)

👥 Tạo nhân viên test...
✅ Tạo staff: Nguyễn Văn A
✅ Tạo staff: Trần Thị B
✅ Tạo staff: Lê Văn C
✅ Tạo staff: Phạm Thị D
✅ Tạo staff: Hoàng Văn E

⏰ Tạo ca làm việc...
✅ Tạo shift: Ca Sáng
✅ Tạo shift: Ca Trưa
✅ Tạo shift: Ca Chiều
✅ Tạo shift: Ca Tối

💰 Tạo cấu hình lương cho nhân viên...
✅ Cấu hình lương: Nguyễn Văn A - 80,000đ/giờ
✅ Cấu hình lương: Trần Thị B - 60,000đ/giờ
✅ Cấu hình lương: Lê Văn C - 50,000đ/giờ
✅ Cấu hình lương: Phạm Thị D - 45,000đ/giờ
✅ Cấu hình lương: Hoàng Văn E - 40,000đ/giờ

📅 Tạo dữ liệu chấm công tháng 01/2026...
✅ Tạo 180 ca làm việc tháng 01/2026

📅 Tạo dữ liệu chấm công tháng 02/2026...
✅ Tạo 165 ca làm việc tháng 02/2026

📊 Thống kê dữ liệu đã tạo:
============================================================

👤 Nguyễn Văn A
   💰 Lương giờ: 80,000đ
   📅 Tháng 1/2026: 42 ca (4 muộn, 2 vắng)
   📅 Tháng 2/2026: 38 ca (3 muộn, 1 vắng)

...

✅ HOÀN TẤT SEED DỮ LIỆU TEST!
```

## 📊 Dữ liệu được tạo

### 1. **Nhân viên (5 người)**

| Nhân viên    | Email           | Lương giờ | Loại      | Đặc điểm                       |
| ------------ | --------------- | --------- | --------- | ------------------------------ |
| Nguyễn Văn A | staff1@test.com | 80,000đ   | Senior    | Lương cao, yêu cầu kỷ luật cao |
| Trần Thị B   | staff2@test.com | 60,000đ   | Trung cấp | Mức trung bình                 |
| Lê Văn C     | staff3@test.com | 50,000đ   | Mới       | Mức cơ bản                     |
| Phạm Thị D   | staff4@test.com | 45,000đ   | Part-time | Ít ca hơn                      |
| Hoàng Văn E  | staff5@test.com | 40,000đ   | Thử việc  | Yêu cầu thấp                   |

**Password chung:** `123456`

### 2. **Ca làm việc (4 ca)**

| Ca       | Giờ           | Thời lượng | Ngày trong tuần |
| -------- | ------------- | ---------- | --------------- |
| Ca Sáng  | 07:00 - 11:00 | 4h         | T2-T6           |
| Ca Trưa  | 11:00 - 14:00 | 3h         | T2-T6           |
| Ca Chiều | 14:00 - 18:00 | 4h         | T2-T6           |
| Ca Tối   | 18:00 - 21:00 | 3h         | T2-CN           |

### 3. **Cấu hình lương chi tiết**

#### **Nguyễn Văn A (Senior)**

```
Lương giờ: 80,000đ
Thưởng 100%: 1,000,000đ
Thưởng ≥95%: 600,000đ
Thưởng ≥90%: 300,000đ
Hệ số OT: 2.0
Phạt đi muộn: 100,000đ/lần
Phạt về sớm: 50,000đ/lần
Phạt nghỉ KP: 300,000đ/ca
Cho phép muộn: 2 lần
```

#### **Trần Thị B (Trung cấp)**

```
Lương giờ: 60,000đ
Thưởng 100%: 700,000đ
Thưởng ≥95%: 400,000đ
Thưởng ≥90%: 200,000đ
Hệ số OT: 1.5
Phạt đi muộn: 70,000đ/lần
Phạt về sớm: 40,000đ/lần
Phạt nghỉ KP: 250,000đ/ca
Cho phép muộn: 3 lần
```

#### **Lê Văn C (Mới)**

```
Lương giờ: 50,000đ
Thưởng 100%: 500,000đ
Thưởng ≥95%: 300,000đ
Thưởng ≥90%: 100,000đ
Hệ số OT: 1.5
Phạt đi muộn: 50,000đ/lần
Phạt về sớm: 30,000đ/lần
Phạt nghỉ KP: 200,000đ/ca
Cho phép muộn: 3 lần
```

#### **Phạm Thị D (Part-time)**

```
Lương giờ: 45,000đ
Thưởng 100%: 400,000đ
Thưởng ≥95%: 200,000đ
Thưởng ≥90%: 100,000đ
Hệ số OT: 1.3
Phạt đi muộn: 40,000đ/lần
Phạt về sớm: 25,000đ/lần
Phạt nghỉ KP: 150,000đ/ca
Cho phép muộn: 2 lần
```

#### **Hoàng Văn E (Thử việc)**

```
Lương giờ: 40,000đ
Thưởng 100%: 300,000đ
Thưởng ≥95%: 150,000đ
Thưởng ≥90%: 50,000đ
Hệ số OT: 1.2
Phạt đi muộn: 30,000đ/lần
Phạt về sớm: 20,000đ/lần
Phạt nghỉ KP: 100,000đ/ca
Cho phép muộn: 1 lần
```

### 4. **Dữ liệu chấm công**

#### **Tỷ lệ phân bố (tháng 01/2026)**

- ✅ Đúng giờ: 70%
- ⏰ Đi muộn: 10%
- 🏃 Về sớm: 5%
- ⚡ Overtime: 10%
- ❌ Nghỉ không phép: 5%

#### **Tỷ lệ phân bố (tháng 02/2026)**

- ✅ Đúng giờ: 65%
- ⏰ Đi muộn: 9%
- 🏃 Về sớm: 5%
- ⚡ Overtime: 18%
- ❌ Nghỉ không phép: 3%

**Đặc điểm:**

- Mỗi nhân viên: 30-50 ca/tháng
- Random 1-2 ca/ngày
- Thời gian muộn: 15-60 phút
- Thời gian về sớm: 30-90 phút
- Overtime: 30-120 phút

## 🧪 Test Scenarios

### Scenario 1: Tạo bảng lương tháng 1/2026

**Steps:**

1. Login: `manager@test.com` / `123456`
2. Vào: **Quản lý lương** > **Bảng lương**
3. Click: **Tạo bảng lương mới**
4. Chọn kỳ: `01/01/2026` - `31/01/2026`
5. Click: **Tạo bảng lương**

**Expected:**

- Tạo thành công payroll
- Hiển thị 5 nhân viên
- Tổng giờ làm của tất cả nhân viên
- Tổng lương, thưởng, khấu trừ

### Scenario 2: Xem chi tiết lương nhân viên

**Steps:**

1. Click vào payroll vừa tạo
2. Xem danh sách salary records
3. Click **Xem chi tiết** một nhân viên

**Expected:**

- Lương cơ bản = giờ làm × lương giờ
- Thưởng chuyên cần (nếu đủ điều kiện)
- Thưởng overtime (nếu có)
- Phạt đi muộn (nếu vượt ngưỡng)
- Phạt về sớm
- Phạt nghỉ không phép
- Tổng lương = cơ bản + thưởng - phạt

### Scenario 3: So sánh 2 tháng

**Steps:**

1. Tạo payroll tháng 1
2. Tạo payroll tháng 2
3. So sánh các chỉ số

**Expected:**

- Tháng 2 có nhiều overtime hơn
- Tháng 2 ít nghỉ không phép hơn
- Lương thay đổi theo performance

### Scenario 4: Test cấu hình lương

**Steps:**

1. Vào: **Quản lý lương** > **Cấu hình lương**
2. Xem danh sách cấu hình
3. Sửa cấu hình Nguyễn Văn A:
   - Tăng lương giờ: 80,000đ → 100,000đ
   - Tăng thưởng 100%: 1,000,000đ → 1,500,000đ
4. Lưu
5. Tạo payroll mới cho tháng 3/2026

**Expected:**

- Payroll mới dùng config mới
- Lương Nguyễn Văn A cao hơn
- Payroll cũ không thay đổi

### Scenario 5: Test các edge cases

#### Case 5.1: Nhân viên 100% ca

- Nguyễn Văn A: Nếu đi đủ 100% ca và không muộn
- **Expected:** Nhận thưởng chuyên cần 1,000,000đ

#### Case 5.2: Nhân viên muộn nhiều

- Nếu nhân viên muộn > maxLateAllowed
- **Expected:**
  - Không được thưởng chuyên cần
  - Bị phạt theo số lần muộn

#### Case 5.3: Nhân viên nghỉ nhiều

- Nếu nghỉ > 5 ca
- **Expected:**
  - Phạt 200,000đ × số ca nghỉ
  - Không đủ điều kiện thưởng 100%

#### Case 5.4: Nhân viên overtime nhiều

- Overtime > 10 giờ
- **Expected:** Thưởng overtime = giờ OT × lương giờ × hệ số

## 📈 Kết quả mong đợi

### **Ví dụ: Nguyễn Văn A - Tháng 01/2026**

Giả sử:

- Tổng ca: 42 ca
- Ca hoàn thành: 40 ca (95.2%)
- Đi muộn: 4 lần (vượt ngưỡng 2)
- Nghỉ KP: 2 ca
- Overtime: 12 giờ

**Tính toán:**

```
Lương cơ bản: 40 ca × 4h × 80,000đ = 12,800,000đ
Thưởng chuyên cần: 0đ (vì muộn > 2 lần)
Thưởng overtime: 12h × 80,000đ × 2.0 = 1,920,000đ
Phạt đi muộn: 4 × 100,000đ = 400,000đ
Phạt nghỉ KP: 2 × 300,000đ = 600,000đ
----------------------------------------
Tổng lương: 12,800,000 + 1,920,000 - 400,000 - 600,000
          = 13,720,000đ
```

## 🔍 Debug & Troubleshooting

### Kiểm tra dữ liệu đã seed

```bash
# 1. Kiểm tra staff shifts
mongosh
use unilife
db.staffshifts.countDocuments({ date: { $gte: ISODate("2026-01-01"), $lte: ISODate("2026-01-31") } })
# Expected: ~180 records

# 2. Kiểm tra salary rates
db.salaryrates.countDocuments()
# Expected: 5 records

# 3. Kiểm tra staff
db.users.countDocuments({ role: "staff" })
# Expected: >= 5 users

# 4. Xem chi tiết một staff shift
db.staffshifts.findOne({ attendanceStatus: "late" })
```

### Xóa dữ liệu test

```javascript
// Chạy trong mongosh
db.staffshifts.deleteMany({
  date: {
    $gte: ISODate("2026-01-01"),
    $lte: ISODate("2026-02-28"),
  },
});

db.salaryrates.deleteMany({
  userId: {
    $in: [
      /* IDs của 5 staff test */
    ],
  },
});

db.payrolls.deleteMany({
  periodStart: { $gte: ISODate("2026-01-01") },
});

db.salaries.deleteMany({
  periodStart: { $gte: ISODate("2026-01-01") },
});
```

Hoặc chạy lại script seed (sẽ tự động xóa và tạo mới).

## 📝 Notes

- Script seed là **idempotent** - chạy nhiều lần vẫn OK
- Dữ liệu cũ của tháng 1-2/2026 sẽ bị xóa và tạo lại
- Manager được lấy từ DB, hoặc tạo mới nếu chưa có
- Mỗi lần chạy sẽ có kết quả khác nhau do random
- Có thể điều chỉnh tỷ lệ late/absent/overtime trong code

## ✅ Checklist Testing

- [ ] Chạy seed script thành công
- [ ] Đăng nhập manager@test.com
- [ ] Tạo payroll tháng 1/2026
- [ ] Xem chi tiết lương từng nhân viên
- [ ] Kiểm tra thưởng chuyên cần
- [ ] Kiểm tra thưởng overtime
- [ ] Kiểm tra phạt đi muộn
- [ ] Kiểm tra phạt nghỉ KP
- [ ] Tạo payroll tháng 2/2026
- [ ] So sánh 2 tháng
- [ ] Sửa cấu hình lương
- [ ] Tạo payroll mới với config mới
- [ ] Export/Print payroll (nếu có)

## 🎯 Next Steps

Sau khi test xong với dữ liệu seed:

1. **Xóa dữ liệu test** trước khi deploy production
2. **Backup production data** trước khi seed
3. **Điều chỉnh logic** nếu phát hiện bug
4. **Thêm validation** nếu thiếu
5. **Optimize query** nếu chậm với nhiều data
