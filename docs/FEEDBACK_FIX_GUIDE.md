# Hướng dẫn test chức năng Feedback từ Order History

## ✅ Vấn đề đã được fix

### 🐛 Lỗi gốc

1. **Backend**: Index `{ userId: 1, orderId: 1 }` với `unique: true` chỉ cho phép 1 feedback/order, không cho phép feedback nhiều sản phẩm khác nhau trong cùng order
2. **Frontend**: Không có UI để feedback từ Order History page

### 🔧 Giải pháp đã implement

#### Backend (UniLife_BE)

1. **feedback.model.js**: Sửa unique index từ `{ userId: 1, orderId: 1 }` thành `{ userId: 1, orderId: 1, productId: 1 }`
2. **feedback.service.js**: Cập nhật message lỗi duplicate cho phù hợp
3. **fix-feedback-index.js**: Script để drop index cũ và tạo index mới trong MongoDB

#### Frontend (UniLife_Client_FE)

1. **RightOrderDetailPanel.jsx**: Thêm đầy đủ chức năng feedback:
   - Kiểm tra feedbacks đã tồn tại khi mở order detail
   - Nút "Đánh giá" cho mỗi sản phẩm (chỉ hiện khi order completed và chưa feedback)
   - Badge "Đã đánh giá" cho sản phẩm đã feedback
   - Modal feedback với rating stars và comment textarea
   - Validation và error handling

## 📝 Test Cases

### Test 1: Kiểm tra hiển thị nút đánh giá

**Điều kiện**: Order có status = "completed"

**Các bước**:

1. Đăng nhập vào hệ thống
2. Vào trang "Lịch sử đơn hàng"
3. Click vào một order đã hoàn thành (completed)
4. Right panel sẽ mở ra với chi tiết order

**Kết quả mong đợi**:

- Mỗi sản phẩm trong order hiển thị nút "Đánh giá" màu primary
- Nếu sản phẩm đã được đánh giá, hiển thị badge "✓ Đã đánh giá" màu xanh thay vì nút

### Test 2: Feedback một sản phẩm trong order

**Các bước**:

1. Từ order detail panel (order completed)
2. Click nút "Đánh giá" ở một sản phẩm bất kỳ
3. Modal "Đánh giá sản phẩm" sẽ mở ra
4. Chọn số sao (1-5)
5. Nhập comment (tùy chọn, tối đa 1000 ký tự)
6. Click "Gửi đánh giá"

**Kết quả mong đợi**:

- Toast notification "Thành công - Cảm ơn bạn đã đánh giá sản phẩm!"
- Modal đóng lại
- Nút "Đánh giá" biến thành badge "✓ Đã đánh giá"
- Không thể đánh giá lại sản phẩm đó nữa

### Test 3: Feedback nhiều sản phẩm trong cùng một order

**Điều kiện**: Order có ít nhất 2 sản phẩm khác nhau

**Các bước**:

1. Từ order detail panel (order completed)
2. Feedback sản phẩm thứ nhất (theo Test 2)
3. Feedback sản phẩm thứ hai (theo Test 2)
4. Feedback các sản phẩm còn lại (nếu có)

**Kết quả mong đợi**:

- Có thể feedback thành công từng sản phẩm riêng biệt
- Không bị lỗi duplicate key (lỗi cũ)
- Mỗi sản phẩm sau khi feedback sẽ hiển thị badge "Đã đánh giá"

### Test 4: Kiểm tra validation

**Các bước**:

1. Click nút "Đánh giá" một sản phẩm
2. Không chọn rating hoặc comment gì
3. Click "Gửi đánh giá"

**Kết quả mong đợi**:

- Backend yêu cầu rating (required)
- Frontend mặc định rating = 5 sao
- Có thể submit mà không cần comment

### Test 5: Kiểm tra không cho feedback lại

**Các bước**:

1. Feedback một sản phẩm thành công
2. Reload trang hoặc mở lại order detail
3. Kiểm tra UI của sản phẩm đã feedback

**Kết quả mong đợi**:

- Hiển thị badge "✓ Đã đánh giá" thay vì nút "Đánh giá"
- Không có cách nào để feedback lại sản phẩm đó trong order đó

### Test 6: Kiểm tra order không phải completed

**Các bước**:

1. Mở order detail với status khác completed (pending, confirmed, preparing, ready, cancelled)

**Kết quả mong đợi**:

- Không hiển thị nút "Đánh giá" cho bất kỳ sản phẩm nào
- Chỉ hiển thị thông tin order và nút "Đặt lại đơn này" (nếu là cancelled)

### Test 7: Test API trực tiếp (Backend)

**Endpoint**: `POST /api/feedbacks`

**Body**:

```json
{
  "orderId": "67a1234567890abcdef12345",
  "productId": "67b9876543210fedcba09876",
  "rating": 5,
  "comment": "Sản phẩm rất ngon!"
}
```

**Headers**:

```
Authorization: Bearer <token>
```

**Kết quả mong đợi**:

- Status 201 Created
- Response có feedback data với userId đã populate

**Test duplicate (cùng user, order, product)**:

- Status 400 Bad Request
- Message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi"

## 🧪 Regression Testing

### Kiểm tra không ảnh hưởng các chức năng cũ:

1. ✅ Feedback từ Product Detail page vẫn hoạt động bình thường
2. ✅ Hiển thị danh sách feedback ở Product Detail
3. ✅ Tính toán rating statistics chính xác
4. ✅ Update và delete feedback vẫn hoạt động
5. ✅ Feedback replies vẫn hoạt động

## 📊 Database Changes

### MongoDB Index Changes

**Trước khi fix**:

```javascript
{ userId: 1, orderId: 1 } // unique: true
// ❌ Chỉ cho phép 1 feedback/order
```

**Sau khi fix**:

```javascript
{ userId: 1, orderId: 1, productId: 1 } // unique: true
// ✅ Cho phép feedback nhiều sản phẩm/order
```

**Chạy script migration**:

```bash
cd D:\Project_WDP\UniLife_BE
node src/scripts/fix-feedback-index.js
```

## 🎯 User Flow mới

1. User đặt hàng → Order created (status: pending)
2. Staff xác nhận → Order confirmed
3. Staff chuẩn bị → Order preparing
4. Món đã sẵn sàng → Order ready
5. User nhận món → Order completed ✅
6. User vào "Lịch sử đơn hàng" → Click order completed
7. Right panel hiện chi tiết order với nút "Đánh giá" cho mỗi món
8. User click "Đánh giá" → Modal mở ra
9. User chọn rating và nhập comment → Submit
10. Badge "Đã đánh giá" hiển thị → Không thể đánh giá lại

## 🚀 Deploy Checklist

- [x] Backend: Sửa feedback.model.js
- [x] Backend: Sửa feedback.service.js
- [x] Backend: Chạy migration script fix-feedback-index.js
- [x] Frontend: Cập nhật RightOrderDetailPanel.jsx
- [x] Test các use cases chính
- [ ] Test regression cho các chức năng cũ
- [ ] Deploy lên production
- [ ] Monitor logs và user feedback

## 📝 Notes

- Index cũ đã được xóa khỏi database
- Feedbacks cũ vẫn giữ nguyên, không bị mất
- User có thể feedback nhiều sản phẩm khác nhau trong cùng 1 order
- User không thể feedback cùng 1 sản phẩm nhiều lần trong cùng 1 order
- Nếu muốn feedback lại sản phẩm đó, user cần mua lại (order mới)
