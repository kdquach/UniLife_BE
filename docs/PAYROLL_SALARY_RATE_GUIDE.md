# Hướng dẫn Quản lý Bảng lương với SalaryRate

## 📋 Tổng quan

Hệ thống quản lý bảng lương tự động tính toán dựa trên:

- ⏰ Giờ làm việc thực tế (từ StaffShift)
- 💰 Mức lương cá nhân (từ SalaryRate)
- 🎁 Thưởng tự động (chuyên cần, làm thêm)
- ⚠️ Khấu trừ tự động (đi muộn, về sớm, vắng)

## 🎯 Quy trình sử dụng

### Bước 1: Thiết lập mức lương cá nhân

Trước khi tạo bảng lương, cần thiết lập mức lương cho từng nhân viên:

**Frontend:** Quản lý mức lương → Thêm/Sửa mức lương

**API Backend:**

```http
POST /api/salary-rates
{
  "userId": "64abc...",
  "canteenId": "64def...",
  "hourlyRate": 50000,
  "effectiveFrom": "2026-01-01",
  "attendanceBonus100": 500000,
  "attendanceBonus95": 300000,
  "attendanceBonus90": 100000,
  "overtimeMultiplier": 1.5,
  "lateDeduction": 50000,
  "earlyLeaveDeduction": 30000,
  "absentDeduction": 100000,
  "maxLateAllowed": 2,
  "note": "Nhân viên chính thức"
}
```

### Bước 2: Tạo bảng lương tự động

**Frontend:** Quản lý bảng lương → Tạo bảng lương mới

**API Backend:**

```http
POST /api/payrolls/generate
{
  "canteenId": "64def...",
  "periodStart": "2026-02-01T00:00:00.000Z",
  "periodEnd": "2026-02-28T23:59:59.999Z",
  "hourlyRate": 50000,  // Optional - fallback cho nhân viên chưa có SalaryRate
  "description": "Bảng lương tháng 2/2026"
}
```

**Hệ thống sẽ tự động:**

1. ✅ Lấy tất cả ca làm việc (status: checked_out) trong kỳ
2. ✅ Group theo nhân viên, tính tổng giờ làm
3. ✅ Ưu tiên lấy `hourlyRate` từ SalaryRate cá nhân
4. ✅ Tính lương cơ bản = totalHours × hourlyRate
5. ✅ Tính thưởng/phạt tự động theo config SalaryRate
6. ✅ Tạo Payroll (draft) và Salary records

### Bước 3: Xem chi tiết và điều chỉnh

**Frontend:** Quản lý bảng lương → Nhấn vào bảng lương → Xem chi tiết

Trong trang chi tiết:

- 📊 Thống kê tổng quan (tổng nhân viên, tổng giờ, tổng lương)
- 📋 Bảng chi tiết từng nhân viên với:
  - Lương giờ cá nhân
  - Số giờ làm việc
  - Lương cơ bản
  - Thưởng tự động
  - Khấu trừ tự động
  - Tổng lương

**Điều chỉnh lương nhân viên:**

- Nhấn nút "Điều chỉnh" ở cột thao tác
- Dialog hiển thị:
  - ✅ Thông tin nhân viên
  - ✅ Lương cơ bản, số giờ
  - ✅ Cấu hình SalaryRate chi tiết
  - ✅ Form điều chỉnh thưởng/khấu trừ thêm
- Chọn loại: Thưởng thêm / Khấu trừ
- Nhập số tiền và lý do
- Lưu thay đổi

**API Backend:**

```http
PATCH /api/salaries/:salaryId
{
  "bonus": 500000,
  "deduction": 0,
  "adjustmentReason": "Thưởng hoàn thành xuất sắc KPI tháng"
}
```

### Bước 4: Duyệt và thanh toán

1. **Duyệt kỳ lương:**
   - Nhấn "Duyệt kỳ lương" khi đã kiểm tra kỹ
   - Status chuyển: `calculated` → `approved`
   - Không thể chỉnh sửa sau khi duyệt

2. **Xác nhận thanh toán:**
   - Nhấn "Xác nhận thanh toán" sau khi đã trả lương
   - Status chuyển: `approved` → `paid`
   - Ghi nhận thời gian thanh toán

## 🔄 Luồng dữ liệu

```
SalaryRate (Config cá nhân)
    ↓
StaffShift (Giờ làm thực tế)
    ↓
Payroll.generatePayroll()
    ↓
- Tính baseSalary = hours × hourlyRate
- Tính bonus tự động (attendance, overtime)
- Tính deduction tự động (late, absent)
    ↓
Salary Records (draft)
    ↓
Manual Adjustment (optional)
    ↓
Approve → Paid
```

## 💡 Công thức tính toán

### 1. Lương cơ bản

```javascript
baseSalary = totalHours × hourlyRate
```

### 2. Thưởng chuyên cần

- **100% chuyên cần:** Không vắng, không muộn → `attendanceBonus100`
- **≥95% chuyên cần:** Muộn ≤ maxLateAllowed, không vắng → `attendanceBonus95`
- **≥90% chuyên cần:** Muộn ≤ maxLateAllowed, vắng ≤ 1 → `attendanceBonus90`

### 3. Thưởng làm thêm

```javascript
overtimeBonus = (overtimeMinutes / 60) × hourlyRate × overtimeMultiplier
```

### 4. Khấu trừ

- Đi muộn: `lateCount × lateDeduction`
- Về sớm: `earlyLeaveCount × earlyLeaveDeduction`
- Vắng mặt: `absentCount × absentDeduction`

### 5. Tổng lương

```javascript
totalSalary = baseSalary + bonus - deduction;
```

## 📊 Ví dụ thực tế

### Nhân viên: Nguyễn Văn A

**Config SalaryRate:**

- Lương giờ: 50,000đ
- Thưởng chuyên cần 100%: 500,000đ
- Phạt đi muộn: 50,000đ
- Hệ số làm thêm: 1.5x

**Tháng 2/2026:**

- Tổng giờ làm: 160 giờ
- Làm thêm: 10 giờ
- Đi muộn: 1 lần
- Chuyên cần: 100%

**Tính toán:**

```
Lương cơ bản    = 160 × 50,000     = 8,000,000đ
Thưởng chuyên cần = 1 × 500,000    =   500,000đ
Thưởng làm thêm  = 10 × 50,000 × 1.5 = 750,000đ
Phạt đi muộn     = 1 × 50,000       =    50,000đ
----------------------------------------
TỔNG LƯƠNG      = 8,000,000 + 500,000 + 750,000 - 50,000
                = 9,200,000đ
```

## 🎨 Giao diện Frontend

### 1. Tạo bảng lương

- Dialog đơn giản chỉ cần chọn kỳ (từ ngày - đến ngày)
- Không cần nhập hourlyRate thủ công
- Hướng dẫn rõ ràng về quy trình tự động

### 2. Chi tiết bảng lương

- Bảng hiển thị đầy đủ thông tin:
  - Cột "Lương giờ": Hiển thị mức lương cá nhân
  - Cột "Số giờ": Tag với icon đồng hồ
  - Cột "Lương cơ bản", "Thưởng", "Khấu trừ", "Tổng lương"
  - Nút "Điều chỉnh" mở dialog

### 3. Dialog điều chỉnh lương

- Phần 1: Thông tin nhân viên và lương hiện tại
- Phần 2: Chi tiết cấu hình SalaryRate (Descriptions bordered)
- Phần 3: Form điều chỉnh (Select loại + InputNumber số tiền + TextArea lý do)
- Alert hiển thị tổng lương sau điều chỉnh

## 🔒 Phân quyền

- **Admin:** Toàn quyền
- **Manager:** Tạo, xem, duyệt, điều chỉnh bảng lương của canteen
- **Staff:** Chỉ xem lương của chính mình

## 📝 Notes

1. **SalaryRate là bắt buộc**: Nên thiết lập cho tất cả nhân viên trước khi tạo bảng lương
2. **Một kỳ lương / canteen**: Không cho phép tạo trùng kỳ
3. **Tính năng nâng cao**: Thưởng/phạt tự động đã được tích hợp trong `payroll.calculator.js`
4. **Trạng thái workflow**: draft → calculated → approved → paid
5. **Audit trail**: Lưu người tạo, người duyệt, người thanh toán, thời gian

## 🚀 API Endpoints

### SalaryRate

- `POST /api/salary-rates` - Thiết lập mức lương
- `GET /api/salary-rates/user/:userId` - Lấy mức lương của user
- `GET /api/salary-rates/canteen/:canteenId` - Lấy theo canteen

### Payroll

- `POST /api/payrolls/generate` - Tạo bảng lương tự động
- `GET /api/payrolls` - Danh sách kỳ lương
- `GET /api/payrolls/:id` - Chi tiết kỳ lương + salaries
- `PATCH /api/payrolls/:id/approve` - Duyệt
- `PATCH /api/payrolls/:id/confirm-payment` - Xác nhận thanh toán
- `DELETE /api/payrolls/:id` - Xóa (chỉ draft/calculated)

### Salary

- `GET /api/salaries?payrollId=xxx` - Danh sách lương theo kỳ
- `GET /api/salaries/:id` - Chi tiết một bản lương
- `PATCH /api/salaries/:id` - Điều chỉnh lương
- `PATCH /api/salaries/:id/approve` - Duyệt lương cá nhân

## 🎯 Best Practices

1. **Thiết lập SalaryRate trước:** Cài đặt đầy đủ cho tất cả nhân viên
2. **Kiểm tra kỹ trước khi duyệt:** Sử dụng chức năng điều chỉnh nếu cần
3. **Backup trước khi duyệt:** Export dữ liệu phòng trường hợp cần rollback
4. **Ghi chú rõ ràng:** Lý do điều chỉnh phải >= 10 ký tự
5. **Workflow tuần tự:** Không nhảy bước trong workflow

## 🐛 Troubleshooting

### Lỗi: "Chưa thiết lập mức lương cho nhân viên này"

- **Nguyên nhân:** Nhân viên chưa có SalaryRate
- **Giải pháp:** Vào "Quản lý mức lương" → Thêm mức lương cho nhân viên

### Lỗi: "Kỳ lương này đã tồn tại"

- **Nguyên nhân:** Đã tạo bảng lương cho kỳ này rồi
- **Giải pháp:** Xem lại danh sách bảng lương hoặc chọn kỳ khác

### Thưởng/phạt không đúng

- **Kiểm tra:** Cấu hình SalaryRate của nhân viên
- **Kiểm tra:** Dữ liệu chấm công (late, absent) trong StaffShift
- **Debug:** Xem field `adjustmentReason` trong Salary record

## 📚 Tham khảo

- [PAYROLL_MODULE_COMPLETE.md](./PAYROLL_MODULE_COMPLETE.md)
- [payroll.calculator.js](../src/modules/payroll/payroll.calculator.js)
- [salaryRate.model.js](../src/modules/salaryRate/salaryRate.model.js)
