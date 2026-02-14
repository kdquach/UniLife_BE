# Fix lỗi nghiêm trọng của chức năng Feedback

## 🐛 Các lỗi đã phát hiện

### 1. Không feedback được ở Product Detail page

**Nguyên nhân**:

- Logic trong `FeedbackSection.jsx` KHÔNG kiểm tra xem user đã feedback sản phẩm trong order nào chưa
- Chỉ lấy tất cả orders completed có sản phẩm đó, không loại trừ orders đã feedback
- Khi user chọn order đã feedback → Backend reject với lỗi duplicate key

### 2. Sản phẩm chưa feedback nhưng bị nhận định đã feedback

**Nguyên nhân**:

- Frontend query feedbacks theo productId CHUNG CHUNG (không filter theo userId)
- API `/feedbacks?productId=xxx` là public route, trả về feedbacks của TẤT CẢ users
- Nếu có user khác feedback sản phẩm đó → Hệ thống tưởng user hiện tại đã feedback

### 3. Cùng sản phẩm trong 2 orders khác nhau nhưng chỉ feedback được 1 lần

**Đã fix trước đó**: Unique index đã được sửa từ `{userId, orderId}` thành `{userId, orderId, productId}` - Cho phép user feedback cùng sản phẩm trong nhiều orders khác nhau

### 4. Backend allowedFilters không chính xác

**Nguyên nhân**:

- `filterPresets.feedback` có `canteenId` và `status` nhưng Feedback model KHÔNG CÓ các fields này
- Thiếu `orderId` trong allowedFilters

## ✅ Giải pháp đã implement

### Backend Changes

#### 1. Sửa `queryHelper.js` - filterPresets.feedback

```javascript
// ❌ CŨ (SAI)
feedback: {
  allowedFilters: ['rating', 'status', 'productId', 'userId', 'canteenId'],
  searchFields: ['comment'],
  allowedSortFields: ['createdAt', 'rating'],
}

// ✅ MỚI (ĐÚNG)
feedback: {
  allowedFilters: ['rating', 'productId', 'userId', 'orderId'],
  searchFields: ['comment'],
  allowedSortFields: ['createdAt', 'rating'],
}
```

#### 2. Thêm endpoint `/feedbacks/my-feedbacks` (Protected)

**File**: `feedback.controller.js`

```javascript
// Lấy feedbacks của user hiện tại (authenticated)
export const getMyFeedbacks = catchAsync(async (req, res) => {
  // Tự động thêm userId vào query để filter
  const query = { ...req.query, userId: req.user._id };
  const result = await feedbackService.getAllFeedbacks(query);
  res
    .status(200)
    .json(formatPaginatedResponse(result, 'Lấy feedback của bạn thành công'));
});
```

**File**: `feedback.routes.js`

```javascript
// Protected routes
router.use(protect);

// ⚠️ QUAN TRỌNG: Route này phải đặt TRƯỚC /:id
router.get('/my-feedbacks', feedbackController.getMyFeedbacks);

router.post('/', feedbackController.createFeedback);
router.get('/:id', feedbackController.getFeedbackById);
router.patch('/:id', feedbackController.updateFeedback);
router.delete('/:id', feedbackController.deleteFeedback);
```

### Frontend Changes

#### 1. FeedbackSection.jsx - Thêm logic kiểm tra feedbacks đã tồn tại

**Thêm state**:

```javascript
const [existingFeedbacks, setExistingFeedbacks] = useState([]);
```

**Cập nhật `fetchUserCompletedOrders`**:

```javascript
const fetchUserCompletedOrders = useCallback(async () => {
  setOrdersLoading(true);
  try {
    const { api } = await import('@/services/axios.config.js');
    const [ordersResponse, feedbacksResponse] = await Promise.all([
      api.get('/orders/my-orders', {
        params: { status: 'completed' },
      }),
      // ✅ Gọi endpoint mới với auth token
      api.get('/feedbacks/my-feedbacks', {
        params: { productId },
      }),
    ]);

    const completedOrders = Array.isArray(ordersResponse.data.data)
      ? ordersResponse.data.data
      : ordersResponse.data.data?.orders || [];

    // ✅ Lấy danh sách orderIds đã feedback
    const feedbacks =
      feedbacksResponse.data?.data || feedbacksResponse.data?.data?.data || [];
    const feedbackOrderIds = new Set(
      feedbacks.map((fb) => fb.orderId?._id || fb.orderId)
    );

    setExistingFeedbacks(feedbacks);

    // ✅ Filter orders: có sản phẩm này VÀ chưa feedback
    const ordersWithProduct = completedOrders.filter((order) => {
      const hasProduct = order.items?.some(
        (item) =>
          item.productId?._id === productId || item.productId === productId
      );
      const notFeedbackYet = !feedbackOrderIds.has(order._id);
      return hasProduct && notFeedbackYet;
    });

    setUserOrders(ordersWithProduct);

    // Auto-select first order if only one available
    if (ordersWithProduct.length === 1 && !formData.orderId) {
      setFormData((prev) => ({ ...prev, orderId: ordersWithProduct[0]._id }));
    } else if (ordersWithProduct.length === 0) {
      setFormData((prev) => ({ ...prev, orderId: null }));
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
    setUserOrders([]);
    setExistingFeedbacks([]);
  } finally {
    setOrdersLoading(false);
  }
}, [productId, formData.orderId]);
```

**Cập nhật message khi không còn order để feedback**:

```jsx
<p>
  {existingFeedbacks.length > 0
    ? 'Bạn đã đánh giá sản phẩm này trong tất cả các đơn hàng có sản phẩm này rồi.'
    : 'Bạn chỉ có thể đánh giá sản phẩm này sau khi có đơn hàng đã hoàn thành chứa sản phẩm này.'}
</p>
```

#### 2. RightOrderDetailPanel.jsx - Xóa code bị duplicate

Đã xóa đoạn comment bị duplicate:

```javascript
// Feedback states
// const [showFeedbackModal, setShowFeedbackModal] = useState(false);
// ... (đã xóa)
```

## 🎯 Kết quả

### ✅ Đã fix

1. **Product Detail page**: User có thể feedback bình thường
   - Chỉ hiển thị orders completed chưa feedback
   - Tự động ẩn orders đã feedback
   - Message rõ ràng khi đã feedback tất cả orders

2. **Logic kiểm tra feedback chính xác**:
   - Query feedbacks theo `userId` + `productId`
   - Chỉ check feedbacks của user hiện tại
   - Không bị ảnh hưởng bởi feedbacks của users khác

3. **Multi-order feedback hoạt động đúng**:
   - User mua sản phẩm X trong order A → feedback được
   - User mua sản phẩm X trong order B → feedback được
   - Unique index `{userId, orderId, productId}` đảm bảo không duplicate

4. **Backend filters chính xác**:
   - Loại bỏ fields không tồn tại (`canteenId`, `status`)
   - Thêm `orderId` để filter được
   - API `/feedbacks/my-feedbacks` trả về feedbacks của user hiện tại

### 🧪 Test Cases

#### Test 1: Feedback từ Product Detail - Order chưa feedback

1. Vào trang Product Detail
2. Click "Viết bình luận"
3. Dropdown chỉ hiển thị orders **chưa feedback**
4. Chọn order → Rating → Comment → Submit
5. ✅ Thành công → Order biến mất khỏi dropdown

#### Test 2: Feedback từ Product Detail - Đã feedback tất cả

1. Vào trang Product Detail (đã feedback tất cả orders có sản phẩm này)
2. Click "Viết bình luận"
3. ✅ Message: "Bạn đã đánh giá sản phẩm này trong tất cả các đơn hàng..."

#### Test 3: Cùng sản phẩm trong nhiều orders

1. User mua sản phẩm X trong order A (completed)
2. User mua sản phẩm X trong order B (completed)
3. Feedback sản phẩm X trong order A → ✅ Thành công
4. Vào lại Product Detail → Dropdown chỉ còn order B
5. Feedback sản phẩm X trong order B → ✅ Thành công
6. ✅ Đã feedback 2 lần cho cùng sản phẩm trong 2 orders khác nhau

#### Test 4: Feedback từ Order History

1. Vào "Lịch sử đơn hàng" → Click order completed
2. Mỗi sản phẩm có nút "Đánh giá"
3. Click → Modal mở → Rating → Comment → Submit
4. ✅ Thành công → Nút biến thành "✓ Đã đánh giá"

## 📝 API Endpoints

### Public Routes

- `GET /api/feedbacks` - Lấy tất cả feedbacks (tất cả users)
- `GET /api/feedbacks/product/:productId` - Feedbacks của sản phẩm
- `GET /api/feedbacks/product/:productId/stats` - Rating statistics

### Protected Routes (Require Auth)

- `GET /api/feedbacks/my-feedbacks?productId=xxx` - **MỚI** - Feedbacks của user hiện tại
- `POST /api/feedbacks` - Tạo feedback mới
- `GET /api/feedbacks/:id` - Chi tiết một feedback
- `PATCH /api/feedbacks/:id` - Cập nhật feedback
- `DELETE /api/feedbacks/:id` - Xóa feedback

## 🚀 Deploy Instructions

1. ✅ Backend đã update - Restart server
2. ✅ Frontend đã update - Rebuild
3. ✅ Database index đã fix (đã chạy migration)
4. ⚠️ Clear browser cache để tránh sử dụng code cũ
5. ⚠️ Test kỹ tất cả các use cases trên

## 📌 Notes

- Endpoint `/feedbacks/my-feedbacks` **BẮT BUỘC** phải đặt trước `/:id` trong routes
- Frontend phải gọi với auth token (đã tự động trong axios interceptor)
- Logic filter feedbacks đã tồn tại dựa trên `Set` của orderIds
- Nếu user chưa có order completed nào → Message: "Bạn chỉ có thể đánh giá..."
- Nếu đã feedback tất cả → Message: "Bạn đã đánh giá sản phẩm này trong tất cả..."
