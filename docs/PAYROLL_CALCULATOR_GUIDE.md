# Hệ thống tính thưởng/phạt tự động - Payroll Calculator

## 📋 Tổng quan

File `payroll.calculator.js` chứa các hàm tính toán tự động các khoản thưởng và khấu trừ cho nhân viên khi tạo bảng lương.

## 🎯 Các quy tắc nghiệp vụ

### 1. Thưởng chuyên cần (Attendance Bonus)

**Điều kiện:**

- Không nghỉ không phép
- Đi muộn không quá 3 lần trong kỳ
- Hoàn thành đủ số ca được phân công

**Mức thưởng:**

- **500,000đ**: Hoàn thành 100% ca làm việc
- **300,000đ**: Hoàn thành >= 95% ca
- **100,000đ**: Hoàn thành >= 90% ca

**Hàm:** `calculateAttendanceBonus(userId, periodStart, periodEnd, canteenId)`

---

### 2. Thưởng làm thêm giờ (Overtime Bonus)

**Điều kiện:**

- Có overtime đã được manager duyệt (`overtimeApproved = true`)

**Mức thưởng:**

- Lương overtime = Số giờ OT × Lương giờ × **1.5**

**Hàm:** `calculateOvertimeBonus(userId, periodStart, periodEnd, canteenId, hourlyRate)`

---

### 3. Phạt đi muộn (Late Deduction)

**Điều kiện:**

- Status là `late` hoặc `critical_late`

**Mức phạt:**

- **50,000đ** mỗi lần đi muộn

**Hàm:** `calculateLateDeduction(userId, periodStart, periodEnd, canteenId)`

---

### 4. Phạt về sớm (Early Leave Deduction)

**Điều kiện:**

- Status là `early_leave`

**Mức phạt:**

- **30,000đ** mỗi lần về sớm

**Hàm:** `calculateEarlyLeaveDeduction(userId, periodStart, periodEnd, canteenId)`

---

### 5. Phạt nghỉ không phép (Absent Deduction)

**Điều kiện:**

- Status là `absent`

**Mức phạt:**

- **200,000đ** mỗi ca nghỉ không phép

**Hàm:** `calculateAbsentDeduction(userId, periodStart, periodEnd, canteenId)`

---

## 🔧 Cách sử dụng

### Trong `payroll.service.js`

```javascript
import { calculateAdjustments } from "./payroll.calculator.js";

// Trong hàm generatePayroll
const adjustments = await calculateAdjustments(
  userId,
  periodStart,
  periodEnd,
  canteenId,
  hourlyRate,
);

// Kết quả trả về:
// {
//   bonus: 800000,
//   deduction: 100000,
//   bonusDetails: "Thưởng chuyên cần 100%; Thưởng overtime 5.5h (x1.5)",
//   deductionDetails: "Phạt đi muộn 2 lần (30 phút)"
// }

const salary = {
  baseSalary: hours * hourlyRate,
  bonus: adjustments.bonus,
  deduction: adjustments.deduction,
  totalSalary: baseSalary + adjustments.bonus - adjustments.deduction,
  adjustmentReason: `Thưởng: ${adjustments.bonusDetails}. Khấu trừ: ${adjustments.deductionDetails}`,
};
```

---

## 📊 Dữ liệu cần thiết

Hệ thống dựa vào các trường trong **StaffShift model**:

### Trường bắt buộc:

- `staffId` - ID nhân viên
- `canteenId` - ID canteen
- `date` - Ngày làm việc
- `status` - Trạng thái ca: `checked_out`, `absent`, `cancelled`

### Trường attendance:

- `attendanceStatus` - `on_time`, `late`, `critical_late`, `early_leave`
- `lateMinutes` - Số phút đi muộn
- `overtimeMinutes` - Số phút làm thêm
- `overtimeApproved` - Overtime có được duyệt không

---

## 🎨 Tùy chỉnh quy tắc

### Thay đổi mức thưởng chuyên cần:

```javascript
// Trong calculateAttendanceBonus()
if (completionRate === 1) {
  bonusAmount = 1000000; // Thay đổi từ 500k lên 1tr
  reason = "Thưởng chuyên cần 100%";
}
```

### Thay đổi mức phạt:

```javascript
// Trong calculateLateDeduction()
const deductionAmount = lateShifts.length * 100000; // Thay đổi từ 50k lên 100k
```

### Thêm quy tắc mới:

1. Tạo hàm mới trong `payroll.calculator.js`:

```javascript
export const calculateWeekendBonus = async (
  userId,
  periodStart,
  periodEnd,
  canteenId,
) => {
  // Logic tính thưởng làm cuối tuần
  return { amount: 200000, reason: "Thưởng làm cuối tuần" };
};
```

2. Thêm vào `calculateAdjustments()`:

```javascript
const weekendBonus = await calculateWeekendBonus(...);
const totalBonus = attendanceBonus.amount + overtimeBonus.amount + weekendBonus.amount;
```

---

## ⚠️ Lưu ý

1. **Tất cả tính toán dựa trên dữ liệu StaffShift đã có** - Đảm bảo attendance được cập nhật chính xác
2. **Manager vẫn có thể điều chỉnh thủ công** sau khi hệ thống tính tự động
3. **Tính toán chỉ chạy khi Generate Payroll** - Không tự động update khi attendance thay đổi
4. **Logic có thể tùy chỉnh** theo yêu cầu riêng của từng canteen

---

## 🚀 Test

Để test các hàm calculator:

```javascript
// Test thưởng chuyên cần
const result = await calculateAttendanceBonus(
  "userId123",
  new Date("2026-02-01"),
  new Date("2026-02-28"),
  "canteenId456",
);
console.log(result); // { amount: 500000, reason: "Thưởng chuyên cần 100%" }
```

---

## 📝 TODO - Cải tiến tương lai

- [ ] Thêm thưởng theo KPI doanh số
- [ ] Tích hợp feedback khách hàng vào thưởng
- [ ] Thưởng nhân viên xuất sắc tháng
- [ ] Cấu hình quy tắc từ database thay vì hard-code
- [ ] Export báo cáo chi tiết thưởng/phạt
- [ ] Notification cho nhân viên khi có thưởng/phạt
