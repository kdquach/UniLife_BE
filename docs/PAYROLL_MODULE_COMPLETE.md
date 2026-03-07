# Module Payroll Management - Hoàn thành ✅

## 📋 Tổng quan

Module quản lý bảng lương đầy đủ với 7 chức năng chính, được triển khai hoàn chỉnh cả Backend (NodeJS/Express/MongoDB) và Frontend (React/Material-UI).

---

## 🎯 Các chức năng đã triển khai

### 1. ✅ View Payroll List

**Mô tả:** Xem danh sách bảng lương theo tháng/nhân viên

**Frontend:**

- File: `src/pages/manager/PayrollList.jsx`
- Features:
  - Hiển thị danh sách kỳ lương với thông tin tổng quan
  - Empty state khi chưa có data
  - Alert khi chưa có payroll tháng hiện tại

**Backend:**

- Endpoint: `GET /api/payrolls`
- Query params: `canteenId`, `status`, `periodStart`, `periodEnd`

---

### 2. ✅ Filter/Search Payroll

**Mô tả:** Hỗ trợ filter/search nâng cao trong View List

**Frontend:**

- Component filter tích hợp trong PayrollList
- Filters:
  - Căng tin
  - Tháng/Năm
  - Trạng thái (draft/calculated/approved/paid)

---

### 3. ✅ Generate Payroll

**Mô tả:** Tính lương nhân viên dựa trên số ca làm việc, số giờ làm

**Frontend:**

- Component: `src/components/payroll/GeneratePayrollDialog.jsx`
- Features:
  - Form nhập thông tin kỳ lương
  - Tự động set mặc định tháng hiện tại
  - Validation đầy đủ

**Backend:**

- Endpoint: `POST /api/payrolls/generate`
- Logic:
  - Tạo Payroll (kỳ lương)
  - Query tất cả StaffShift đã check_out trong kỳ
  - Tính tổng giờ làm từng nhân viên
  - Tạo Salary records cho từng nhân viên
  - Cập nhật thống kê tổng

---

### 4. ✅ Set Salary Rate

**Mô tả:** Thiết lập mức lương theo giờ cho từng nhân viên

**Frontend:**

- Service: `src/services/salaryRate.service.js`
- Tích hợp vào các trang quản lý nhân viên

**Backend:**

- Model: `src/modules/salaryRate/salaryRate.model.js`
- Endpoints:
  - `POST /api/salary-rates` - Thiết lập mức lương
  - `GET /api/salary-rates/user/:userId` - Lấy mức lương của 1 user
  - `GET /api/salary-rates/canteen/:canteenId` - Lấy theo căng tin
  - `GET /api/salary-rates` - Lấy tất cả
  - `DELETE /api/salary-rates/user/:userId` - Xóa

---

### 5. ✅ View Salary Detail

**Mô tả:** Xem chi tiết lương từng nhân viên (giờ làm, thưởng, khấu trừ)

**Frontend:**

- File: `src/pages/manager/PayrollDetail.jsx`
- Features:
  - Thông tin tổng quan kỳ lương
  - Danh sách chi tiết lương từng nhân viên
  - Hiển thị: giờ làm, lương CB, thưởng, khấu trừ, tổng lương

**Backend:**

- Endpoint: `GET /api/payrolls/:id`
- Response: Payroll + Array of Salaries

---

### 6. ✅ Adjust Payroll

**Mô tả:** Điều chỉnh lương thủ công (thưởng, phạt, hỗ trợ thêm)

**Frontend:**

- Component: `src/components/payroll/AdjustSalaryDialog.jsx`
- Features:
  - Form điều chỉnh bonus/deduction
  - Preview tổng lương sau điều chỉnh
  - Bắt buộc nhập ghi chú

**Backend:**

- Endpoint: `PATCH /api/payrolls/:payrollId/salaries/:salaryId`
- Body: `{ bonus, deduction, note }`
- Validation: Không cho sửa nếu đã lock hoặc paid

---

### 7. ✅ Approve Payroll

**Mô tả:** Xác nhận bảng lương trước khi chi trả

**Frontend:**

- Button "Duyệt kỳ lương" trong PayrollDetail
- Confirm dialog trước khi approve

**Backend:**

- Endpoint: `PATCH /api/payrolls/:id/approve`
- Logic:
  - Chuyển status: calculated → approved
  - Lock payroll (isLocked = true)
  - Cập nhật approvedBy, approvedAt
  - Update tất cả Salary trong kỳ thành approved

**Bonus:**

- `PATCH /api/payrolls/:id/pay` - Xác nhận thanh toán (approved → paid)

---

## 🗄️ Cấu trúc Database

### 1. Payroll (Master/Header)

```javascript
{
  canteenId: ObjectId,
  periodStart: Date,
  periodEnd: Date,
  description: String,
  totalStaff: Number,
  totalHours: Number,
  totalAmount: Number,
  totalBonus: Number,
  totalDeduction: Number,
  status: enum[draft, calculated, approved, paid, cancelled],
  hourlyRate: Number,
  isLocked: Boolean,
  version: Number,
  createdBy: ObjectId,
  approvedBy: ObjectId,
  approvedAt: Date,
  paidBy: ObjectId,
  paidAt: Date,
  note: String
}
```

### 2. Salary (Detail/Items)

```javascript
{
  payrollId: ObjectId, // FK to Payroll
  userId: ObjectId,
  canteenId: ObjectId,
  periodStart: Date,
  periodEnd: Date,
  totalHours: Number,
  baseSalary: Number,
  bonus: Number,
  deduction: Number,
  totalSalary: Number, // auto calculated
  status: enum[pending, calculated, approved, paid],
  calculatedAt: Date,
  paidAt: Date,
  note: String
}
```

### 3. SalaryRate (Staff Hourly Rate)

```javascript
{
  userId: ObjectId (unique),
  canteenId: ObjectId,
  hourlyRate: Number,
  effectiveFrom: Date,
  note: String,
  updatedBy: ObjectId
}
```

---

## 📁 Cấu trúc Files

### Backend

```
src/modules/
├── payroll/
│   ├── payroll.model.js
│   ├── payroll.service.js
│   ├── payroll.controller.js
│   └── payroll.routes.js
├── salary/
│   ├── salary.model.js (updated: thêm payrollId)
│   ├── salary.service.js
│   ├── salary.controller.js
│   └── salary.routes.js
└── salaryRate/
    ├── salaryRate.model.js
    ├── salaryRate.service.js
    ├── salaryRate.controller.js
    └── salaryRate.routes.js
```

### Frontend

```
src/
├── services/
│   ├── payroll.service.js
│   └── salaryRate.service.js
├── components/payroll/
│   ├── GeneratePayrollDialog.jsx
│   ├── AdjustSalaryDialog.jsx
│   └── PayrollStatusBadge.jsx
└── pages/manager/
    ├── PayrollList.jsx
    └── PayrollDetail.jsx
```

---

## 🔌 API Endpoints

### Payroll Management

```
GET    /api/payrolls                           # Danh sách kỳ lương
GET    /api/payrolls/:id                       # Chi tiết kỳ lương + salaries
GET    /api/payrolls/stats                     # Thống kê
POST   /api/payrolls/generate                  # Generate payroll tự động ⭐
POST   /api/payrolls                           # Tạo kỳ lương manual
PATCH  /api/payrolls/:id/approve               # Duyệt kỳ lương
PATCH  /api/payrolls/:id/pay                   # Xác nhận thanh toán
PATCH  /api/payrolls/:payrollId/salaries/:salaryId  # Adjust lương
DELETE /api/payrolls/:id                       # Xóa (chỉ draft/calculated)
```

### Salary Rate Management

```
GET    /api/salary-rates                       # Tất cả mức lương
GET    /api/salary-rates/user/:userId          # Mức lương của 1 user
GET    /api/salary-rates/canteen/:canteenId    # Mức lương theo canteen
POST   /api/salary-rates                       # Set/Update mức lương
DELETE /api/salary-rates/user/:userId          # Xóa mức lương
```

---

## 🎨 UI/UX Features

### PayrollList Page

- ✅ Empty state với call-to-action
- ✅ Alert nếu chưa có payroll tháng hiện tại
- ✅ Filter nâng cao: canteen, month, year, status
- ✅ Badge màu theo status
- ✅ Quick actions: View, Approve, Pay, Delete

### PayrollDetail Page

- ✅ Header với back button
- ✅ Summary card: thông tin kỳ lương
- ✅ Statistics card: tổng nhân viên, giờ, lương
- ✅ Table chi tiết lương từng nhân viên
- ✅ Adjust button (chỉ khi chưa lock)
- ✅ Approve/Pay buttons theo trạng thái

### Dialogs

- ✅ GeneratePayrollDialog: Form tạo kỳ lương
- ✅ AdjustSalaryDialog: Form điều chỉnh lương với preview

---

## 🚀 Workflow

```
1. SET SALARY RATE (Optional - mỗi nhân viên 1 lần)
   └─> Thiết lập mức lương theo giờ cho từng nhân viên

2. GENERATE PAYROLL (Hàng tháng)
   └─> Tạo kỳ lương + tính lương tự động
       Status: draft → calculated

3. VIEW & FILTER (Manager review)
   └─> Xem danh sách, filter theo tháng/canteen/status

4. VIEW DETAIL (Check từng nhân viên)
   └─> Xem chi tiết lương: giờ làm, lương CB, bonus, deduction

5. ADJUST (Nếu cần)
   └─> Điều chỉnh bonus/deduction cho từng nhân viên

6. APPROVE (Manager duyệt)
   └─> Duyệt kỳ lương → Lock → không cho sửa
       Status: calculated → approved

7. CONFIRM PAYMENT (Finance xác nhận)
   └─> Xác nhận đã thanh toán
       Status: approved → paid
```

---

## ✅ Testing Checklist

### Backend

- [x] Generate payroll tính đúng tổng giờ từ StaffShift
- [x] Không tạo trùng payroll cho cùng kỳ + canteen
- [x] Adjust salary update đúng và recalculate totals
- [x] Approve lock payroll và không cho sửa
- [x] Status workflow: draft → calculated → approved → paid

### Frontend

- [x] Empty state hiển thị đúng
- [x] Alert tháng hiện tại chưa có payroll
- [x] Filter hoạt động đúng
- [x] Generate dialog validation đầy đủ
- [x] Adjust dialog preview tổng lương chính xác
- [x] Approve/Pay buttons hiển thị theo status
- [x] Navigation đúng giữa List và Detail

---

## 🎯 Kết luận

✅ **Hoàn thành đầy đủ 7 chức năng** như yêu cầu
✅ **Backend**: API đầy đủ, validation tốt, workflow rõ ràng
✅ **Frontend**: UI/UX thân thiện, responsive, Material-UI
✅ **Database**: Cấu trúc Master-Detail hợp lý, có index
✅ **Routes & Navigation**: Tích hợp vào Sidebar, routing đầy đủ

---

## 🔧 Cách chạy

### Backend

```bash
cd UniLife_BE
npm install
npm run dev
```

### Frontend

```bash
cd UniLife_Dashboard_FE
npm install
npm run dev
```

### Test API

```bash
# Generate payroll
POST http://localhost:5000/api/payrolls/generate
{
  "canteenId": "xxx",
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-31",
  "hourlyRate": 50000,
  "description": "Lương tháng 3/2026"
}
```

---

## 📝 Notes

- Payroll chỉ có thể xóa khi status = draft hoặc calculated
- Salary adjustment chỉ khi payroll chưa lock
- Mỗi user chỉ có 1 mức lương hiện tại (SalaryRate)
- Generate payroll tự động query từ StaffShift (attendance)
- Tất cả endpoints đều có authentication & authorization

---

**Developer:** GitHub Copilot  
**Date:** March 2, 2026  
**Status:** ✅ Complete & Ready for Production
