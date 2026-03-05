# Cấu hình Thưởng/Phạt từ SalaryRate

## 📋 Tổng quan

Giờ đây bạn có thể **cấu hình mức thưởng/phạt riêng cho từng nhân viên** thông qua bảng `SalaryRate`.

## 🎯 Các trường cấu hình mới

### 1. **Thưởng chuyên cần (Attendance Bonus)**

| Trường               | Mặc định | Mô tả                         |
| -------------------- | -------- | ----------------------------- |
| `attendanceBonus100` | 500,000đ | Thưởng khi hoàn thành 100% ca |
| `attendanceBonus95`  | 300,000đ | Thưởng khi hoàn thành ≥95% ca |
| `attendanceBonus90`  | 100,000đ | Thưởng khi hoàn thành ≥90% ca |

### 2. **Thưởng Overtime**

| Trường               | Mặc định | Mô tả                            |
| -------------------- | -------- | -------------------------------- |
| `overtimeMultiplier` | 1.5      | Hệ số nhân lương OT (1.5 = 150%) |

### 3. **Phạt**

| Trường                | Mặc định | Mô tả                       |
| --------------------- | -------- | --------------------------- |
| `lateDeduction`       | 50,000đ  | Phạt mỗi lần đi muộn        |
| `earlyLeaveDeduction` | 30,000đ  | Phạt mỗi lần về sớm         |
| `absentDeduction`     | 200,000đ | Phạt mỗi ca nghỉ không phép |

### 4. **Ngưỡng điều kiện**

| Trường           | Mặc định | Mô tả                                            |
| ---------------- | -------- | ------------------------------------------------ |
| `maxLateAllowed` | 3        | Số lần đi muộn tối đa vẫn được thưởng chuyên cần |

---

## 🔧 Cách sử dụng API

### 1. Thiết lập mức lương + config thưởng/phạt

**Endpoint:** `POST /api/salary-rates`

**Body mẫu - Nhân viên thường:**

```json
{
  "userId": "673abc123...",
  "canteenId": "673def456...",
  "hourlyRate": 50000,
  "attendanceBonus100": 500000,
  "attendanceBonus95": 300000,
  "attendanceBonus90": 100000,
  "overtimeMultiplier": 1.5,
  "lateDeduction": 50000,
  "earlyLeaveDeduction": 30000,
  "absentDeduction": 200000,
  "maxLateAllowed": 3,
  "note": "Mức lương và thưởng/phạt chuẩn"
}
```

**Body mẫu - Nhân viên senior (thưởng cao hơn):**

```json
{
  "userId": "673xyz789...",
  "canteenId": "673def456...",
  "hourlyRate": 80000,
  "attendanceBonus100": 1000000,
  "attendanceBonus95": 600000,
  "attendanceBonus90": 300000,
  "overtimeMultiplier": 2.0,
  "lateDeduction": 100000,
  "earlyLeaveDeduction": 50000,
  "absentDeduction": 300000,
  "maxLateAllowed": 2,
  "note": "Nhân viên senior - thưởng cao, phạt nặng hơn"
}
```

**Body mẫu - Nhân viên mới (ít phạt):**

```json
{
  "userId": "673new111...",
  "canteenId": "673def456...",
  "hourlyRate": 40000,
  "attendanceBonus100": 300000,
  "attendanceBonus95": 150000,
  "attendanceBonus90": 50000,
  "overtimeMultiplier": 1.5,
  "lateDeduction": 30000,
  "earlyLeaveDeduction": 20000,
  "absentDeduction": 150000,
  "maxLateAllowed": 5,
  "note": "Nhân viên mới - nhẹ nhàng hơn trong thời gian thử việc"
}
```

### 2. Lấy thông tin SalaryRate của nhân viên

**Endpoint:** `GET /api/salary-rates/user/:userId`

**Response:**

```json
{
  "status": "success",
  "data": {
    "salaryRate": {
      "_id": "...",
      "userId": "...",
      "canteenId": "...",
      "hourlyRate": 50000,
      "attendanceBonus100": 500000,
      "attendanceBonus95": 300000,
      "attendanceBonus90": 100000,
      "overtimeMultiplier": 1.5,
      "lateDeduction": 50000,
      "earlyLeaveDeduction": 30000,
      "absentDeduction": 200000,
      "maxLateAllowed": 3,
      "effectiveFrom": "2026-03-01T00:00:00.000Z",
      "note": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### 3. Lấy tất cả SalaryRate của canteen

**Endpoint:** `GET /api/salary-rates/canteen/:canteenId`

---

## 💡 Ví dụ sử dụng

### Case 1: Nhân viên Part-time

```json
{
  "hourlyRate": 35000,
  "attendanceBonus100": 200000,
  "attendanceBonus95": 100000,
  "attendanceBonus90": 50000,
  "overtimeMultiplier": 1.3,
  "lateDeduction": 30000,
  "earlyLeaveDeduction": 20000,
  "absentDeduction": 100000,
  "maxLateAllowed": 2,
  "note": "Part-time - ít ca hơn nên thưởng thấp hơn"
}
```

### Case 2: Trưởng ca

```json
{
  "hourlyRate": 100000,
  "attendanceBonus100": 1500000,
  "attendanceBonus95": 1000000,
  "attendanceBonus90": 500000,
  "overtimeMultiplier": 2.5,
  "lateDeduction": 150000,
  "earlyLeaveDeduction": 100000,
  "absentDeduction": 500000,
  "maxLateAllowed": 1,
  "note": "Trưởng ca - yêu cầu kỷ luật cao, thưởng cao"
}
```

### Case 3: Thử việc

```json
{
  "hourlyRate": 40000,
  "attendanceBonus100": 0,
  "attendanceBonus95": 0,
  "attendanceBonus90": 0,
  "overtimeMultiplier": 1.0,
  "lateDeduction": 20000,
  "earlyLeaveDeduction": 10000,
  "absentDeduction": 50000,
  "maxLateAllowed": 10,
  "note": "Thời gian thử việc - không thưởng, phạt nhẹ"
}
```

---

## 🔄 Flow hoạt động

1. **Manager thiết lập SalaryRate** cho nhân viên (bao gồm hourlyRate + config thưởng/phạt)
2. **Hệ thống lưu config** vào database
3. **Khi Generate Payroll:**
   - `payroll.calculator.js` gọi `getUserConfig(userId)`
   - Lấy config từ SalaryRate (hoặc dùng default nếu không có)
   - Tính toán thưởng/phạt theo config riêng của nhân viên đó
4. **Kết quả:** Mỗi nhân viên có mức thưởng/phạt phù hợp với vị trí và năng lực

---

## ⚙️ Giá trị mặc định

Nếu **KHÔNG** thiết lập config trong SalaryRate, hệ thống sẽ dùng giá trị mặc định:

```javascript
{
  attendanceBonus100: 500000,
  attendanceBonus95: 300000,
  attendanceBonus90: 100000,
  overtimeMultiplier: 1.5,
  lateDeduction: 50000,
  earlyLeaveDeduction: 30000,
  absentDeduction: 200000,
  maxLateAllowed: 3
}
```

---

## 🎨 Tùy chỉnh trong code

### Thay đổi giá trị mặc định

Sửa trong `payroll.calculator.js`, hàm `getUserConfig()`:

```javascript
const getUserConfig = async (userId) => {
  const salaryRate = await SalaryRate.findOne({ userId }).lean();

  return {
    attendanceBonus100: salaryRate?.attendanceBonus100 || 1000000, // Thay đổi ở đây
    attendanceBonus95: salaryRate?.attendanceBonus95 || 600000,
    // ...
  };
};
```

---

## 🚀 Test

### Test 1: Tạo SalaryRate với config

```bash
POST http://localhost:5000/api/salary-rates
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "673abc123...",
  "canteenId": "673def456...",
  "hourlyRate": 50000,
  "attendanceBonus100": 800000,
  "lateDeduction": 70000
}
```

### Test 2: Generate Payroll và kiểm tra

1. Tạo bảng lương mới
2. Kiểm tra salary records → Thấy bonus/deduction được tính theo config riêng
3. Xem `adjustmentReason` để thấy chi tiết

---

## 📝 Lưu ý quan trọng

1. **Mỗi user chỉ có 1 SalaryRate** (unique constraint)
2. **Cập nhật sẽ ghi đè** config cũ
3. **Không có config = dùng default** - Không bị lỗi
4. **Config áp dụng khi Generate Payroll** - Không tự động update payroll cũ
5. **Manager cần thiết lập trước** khi tạo bảng lương để có effect

---

## ✅ Checklist triển khai

- [x] Thêm các trường config vào SalaryRate model
- [x] Tạo hàm `getUserConfig()` trong calculator
- [x] Cập nhật tất cả hàm tính toán sử dụng config
- [x] API để CRUD SalaryRate đã có sẵn
- [ ] **TODO:** Tạo UI Frontend để manager cấu hình dễ dàng
- [ ] **TODO:** Validation để đảm bảo giá trị config hợp lệ

---

## 🎯 Kế hoạch mở rộng

### Tương lai có thể thêm:

1. **PayrollConfig cho toàn Canteen:**
   - Config mặc định cho toàn canteen
   - SalaryRate cá nhân override nếu cần

2. **Config theo thời gian:**
   - Tháng 12 tăng gấp đôi thưởng
   - Tết tăng hệ số overtime lên 3.0

3. **Config theo vị trí:**
   - Bếp trưởng, thu ngân, phục vụ có config khác nhau
   - Lưu trong User model hoặc Position model

4. **History tracking:**
   - Lưu lịch sử thay đổi config
   - Audit trail cho compliance
