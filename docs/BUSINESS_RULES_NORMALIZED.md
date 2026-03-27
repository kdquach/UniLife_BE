# BUSINESS RULES NORMALIZED (Use Case + Backend Code)

## 1) Phạm vi & nguồn tổng hợp

Tài liệu này chuẩn hóa Business Rules dựa trên:

- Use Case trong file `Tong hop Business rule.txt`
- Backend Node.js/Express/MongoDB hiện tại (route, middleware, service, model)

Ưu tiên chuẩn hóa theo hành vi thực tế trong code (JWT, phân quyền, validate, state machine, ownership scope, atomic update).

---

## 2) Business Rules chuẩn hóa (40 rules)

## A. Authentication & Authorization

- **BR-01**: Mọi API protected bắt buộc có Bearer JWT hợp lệ.
- **BR-02**: Token đã logout/blacklist không được tái sử dụng.
- **BR-03**: `tokenVersion` lệch giữa JWT và user hiện tại => phiên đăng nhập bị thu hồi.
- **BR-04**: Tài khoản `inactive` hoặc `banned` bị chặn truy cập nghiệp vụ.
- **BR-05**: Tài khoản `pending` chỉ được phép vào nhóm API giới hạn cho kích hoạt phiên đầu.
- **BR-06**: Quyền truy cập cấp route áp dụng theo role (`restrictTo`).
- **BR-07**: Quyền chức năng áp dụng theo permission code (`requirePermission`), thỏa **ít nhất 1** permission yêu cầu.
- **BR-08**: Quyền theo vai trò/khối nghiệp vụ phải đúng phạm vi (ví dụ dashboard/system notification/voucher/product management).
- **BR-09**: Các chức năng quản trị lõi (role/permission, governance, banner admin) chỉ cho role phù hợp (đa số admin).
- **BR-10**: Tác vụ nhạy cảm (create/update/delete nghiệp vụ) phải ghi audit log.

## B. Validation

- **BR-11**: Email phải đúng định dạng và unique theo user.
- **BR-12**: Số điện thoại phải đúng format hệ thống và unique khi áp dụng.
- **BR-13**: Mật khẩu tối thiểu 6 ký tự; đổi mật khẩu phải khớp xác nhận và khác mật khẩu hiện tại.
- **BR-14**: OTP là mã 6 chữ số, hết hạn 5 phút, giới hạn số lần nhập sai.
- **BR-15**: Gửi lại OTP phải tuân thủ cooldown/rate-limit.
- **BR-16**: Reset password token bắt buộc hợp lệ và còn hạn.
- **BR-17**: ID/date/query/filter phải hợp lệ; dữ liệu sai định dạng trả lỗi 4xx.
- **BR-18**: Upload file phải đúng mime type ảnh được phép và giới hạn dung lượng/số lượng.

## C. Data Integrity

- **BR-19**: Tên danh mục theo canteen (product/ingredient category) phải unique (không phân biệt hoa thường).
- **BR-20**: Cart unique theo `(userId, canteenId)`; Wishlist unique theo `userId`, và không được nhân bản cùng 1 product trong wishlist.
- **BR-21**: Feedback unique theo bộ `(userId, orderId, productId)`.
- **BR-22**: Order/Payment tuân thủ enum trạng thái/phương thức; các trường tiền phải không âm.
- **BR-23**: Tồn kho không được âm; mọi trừ kho thất bại phải rollback phần đã xử lý.
- **BR-24**: Product xóa mềm mặc định bị ẩn khỏi query thông thường.
- **BR-25**: Mã voucher phải unique và chuẩn hóa uppercase.
- **BR-26**: Các nghiệp vụ tranh chấp đồng thời phải dùng cơ chế atomic/optimistic để tránh double update.

## D. Business Logic

- **BR-27**: Tài khoản social không được login/đổi/reset theo luồng local password; Google login auto-verify email theo policy.
- **BR-28**: Luồng đăng ký/khôi phục mật khẩu chỉ hoàn tất sau khi OTP hợp lệ.
- **BR-29**: Logout phải invalid token phía server; client được phép xóa local session ngay cả khi logout API lỗi.
- **BR-30**: Profile chỉ cho cập nhật các trường được whitelist; cập nhật avatar sẽ thay thế tài nguyên cũ.
- **BR-31**: Dữ liệu public chỉ hiển thị entity đang active/available theo điều kiện nghiệp vụ.
- **BR-32**: Cart/Order/Re-order phải thỏa tính sẵn sàng món, đúng context canteen, đúng giá hiện tại và điều kiện phục vụ theo ngày.
- **BR-33**: Voucher apply phải qua chain validate (thời gian/phạm vi/quota/min-spend...) và tổng tiền cuối không âm.
- **BR-34**: Thanh toán online chỉ cập nhật kết quả khi chữ ký callback hợp lệ; status chuyển đúng luồng.
- **BR-35**: Đánh giá chỉ hợp lệ khi user đã mua và đơn hoàn tất; user chỉ sửa/xóa feedback của chính mình.
- **BR-36**: Lập lịch/đổi ca phải kiểm tra trùng ca, giới hạn nhân sự ca, và ràng buộc thời điểm tương lai.

## E. State & Workflow

- **BR-37**: Các nghiệp vụ chính phải tuân thủ state machine hợp lệ (order/payment/voucher/schedule/shift-change).
- **BR-38**: Có state transition tự động theo thời gian/cron (auto-cancel đơn quá hạn, missing checkout, voucher transition, QR hết hạn).

## F. Ownership & Access Control

- **BR-39**: User chỉ truy cập dữ liệu cá nhân của chính mình (profile, order history/detail, wishlist, feedback cá nhân, notification cá nhân, attendance cá nhân).
- **BR-40**: Staff/Manager bị giới hạn dữ liệu theo canteen/phạm vi được gán; cross-canteen bị chặn.

---

## 3) Mapping Use Case -> Business Rules

> Mỗi UC được map tới tập BR liên quan. Một BR có thể tái sử dụng cho nhiều UC.

| Use Case                                     | BR áp dụng                                             |
| -------------------------------------------- | ------------------------------------------------------ |
| UC01 Login                                   | BR-01, BR-02, BR-03, BR-04, BR-05, BR-11, BR-13, BR-27 |
| UC02 Register                                | BR-11, BR-12, BR-13, BR-14, BR-15, BR-28               |
| UC03 Login with Google                       | BR-11, BR-27, BR-28                                    |
| UC04 Logout                                  | BR-01, BR-02, BR-29                                    |
| UC05 Forgot Password                         | BR-11, BR-13, BR-14, BR-15, BR-16, BR-27, BR-28        |
| UC06 Change Password                         | BR-01, BR-03, BR-04, BR-05, BR-13, BR-27               |
| UC7.1 View Profile                           | BR-01, BR-39                                           |
| UC7.2 Upload Avatar                          | BR-01, BR-18, BR-30, BR-39                             |
| UC7.3 Update Profile                         | BR-01, BR-17, BR-30, BR-39                             |
| UC08 View Food Category                      | BR-31                                                  |
| UC9.1 View Canteens                          | BR-31                                                  |
| UC9.2 Filter Canteen                         | BR-17, BR-31                                           |
| UC9.3 View Canteen Detail                    | BR-31                                                  |
| UC10.1 View Food Menu                        | BR-31                                                  |
| UC10.2 Filter Food by Category / Search Food | BR-17, BR-31                                           |
| UC10.3 View Food Detail                      | BR-31                                                  |
| UC11.1 View Favorite Foods                   | BR-01, BR-20, BR-39                                    |
| UC11.2 Add/Delete Favorite Product           | BR-01, BR-20, BR-31, BR-39                             |
| UC11.3 Clear Favorite Food                   | BR-01, BR-20, BR-39                                    |
| UC12.1 View All Notifications                | BR-01, BR-08, BR-39, BR-40                             |
| UC12.2 Mark as Seen Notifications            | BR-01, BR-39, BR-40                                    |
| UC12.3 Filter Notification                   | BR-01, BR-08, BR-17, BR-39, BR-40                      |
| UC12.4 View Detail Notification              | BR-01, BR-39, BR-40                                    |
| UC13.1 View Rating Food                      | BR-31, BR-35                                           |
| UC13.2 Add Rating Food                       | BR-01, BR-21, BR-35, BR-39                             |
| UC13.3 Update Rating Food                    | BR-01, BR-35, BR-39                                    |
| UC13.4 Delete Rating Food                    | BR-01, BR-35, BR-39                                    |
| UC14.1 View Order History                    | BR-01, BR-17, BR-37, BR-39                             |
| UC14.2 Show Pickup QR Code                   | BR-01, BR-37, BR-38, BR-39                             |
| UC14.4 Re-order                              | BR-01, BR-32, BR-39, BR-40                             |
| UC14.5 View Order Detail                     | BR-01, BR-37, BR-39                                    |
| UC14.5 Tracking Order Status                 | BR-01, BR-17, BR-37, BR-39                             |
| UC16.1 View Cart                             | BR-01, BR-20, BR-32, BR-39                             |
| UC16.2 Add To Cart                           | BR-01, BR-20, BR-31, BR-32, BR-39                      |
| UC16.3 Edit Cart                             | BR-01, BR-20, BR-32, BR-39                             |
| UC16.4 Delete Cart Item                      | BR-01, BR-20, BR-39                                    |
| UC16.5 Payment Order                         | BR-01, BR-22, BR-34, BR-37, BR-39                      |
| UC16.6 Voucher Apply                         | BR-25, BR-33                                           |
| UC17.1 View Ingredient Categories            | BR-01, BR-06, BR-40                                    |
| UC17.2 View Ingredient Category Detail       | BR-01, BR-06, BR-40                                    |
| UC17.3 Create Ingredient Category            | BR-01, BR-06, BR-17, BR-19, BR-40                      |
| UC17.4 Update Ingredient Category            | BR-01, BR-06, BR-17, BR-19, BR-40                      |
| UC18.1 View Product Categories               | BR-01, BR-06, BR-07, BR-40                             |
| UC18.2 View Product Category Detail          | BR-01, BR-06, BR-07, BR-40                             |
| UC18.3 Create Product Category               | BR-01, BR-07, BR-17, BR-19, BR-40                      |
| UC18.4 Update Product Category               | BR-01, BR-07, BR-17, BR-19, BR-40                      |
| UC19.1 Check-in                              | BR-01, BR-06, BR-17, BR-26, BR-36, BR-38, BR-39        |
| UC19.2 Check-out                             | BR-01, BR-06, BR-17, BR-26, BR-36, BR-38, BR-39        |
| UC19.3 View shift today                      | BR-01, BR-06, BR-36, BR-39                             |
| UC19.4 View Attendance History               | BR-01, BR-06, BR-17, BR-39                             |
| UC19.5 View Attendance Detail                | BR-01, BR-06, BR-17, BR-39                             |
| UC19.6 Filter Attendance                     | BR-01, BR-06, BR-17, BR-39                             |
| UC20.1 View Work Schedule                    | BR-01, BR-06, BR-39                                    |
| UC20.2 Change Working Shift                  | BR-01, BR-06, BR-17, BR-36, BR-37, BR-39               |
| UC21.1 View List Order                       | BR-01, BR-06, BR-37, BR-40                             |
| UC21.2 View Order Detail                     | BR-01, BR-06, BR-40                                    |
| UC21.3 Filter Orders by Status               | BR-01, BR-06, BR-17, BR-40                             |
| UC21.4 Handle Expired / No-show Orders       | BR-37, BR-38, BR-40                                    |
| UC_Order_05_Complete_Order_Manually          | BR-01, BR-06, BR-37, BR-40                             |
| UC23.1 View All Food                         | BR-01, BR-06, BR-07, BR-24, BR-40                      |
| UC23.2 View Food Detail                      | BR-01, BR-06, BR-07, BR-24, BR-40                      |
| UC23.3 Create Food                           | BR-01, BR-06, BR-07, BR-17, BR-24, BR-40               |
| UC23.4 Update Food                           | BR-01, BR-06, BR-07, BR-17, BR-24, BR-40               |
| UC23.5 Assign Food to Menu                   | BR-01, BR-06, BR-07, BR-31, BR-36, BR-37, BR-40        |
| UC23.6 Filter Food                           | BR-01, BR-06, BR-07, BR-17, BR-24, BR-40               |
| UC24.1 View Menu                             | BR-31                                                  |
| UC24.2 View Menu Detail                      | BR-31                                                  |
| UC24.3 Create Menu                           | BR-01, BR-06, BR-17, BR-37, BR-40                      |
| UC24.4 Update Menu                           | BR-01, BR-06, BR-17, BR-37, BR-40                      |
| UC24.5 Delete Menu                           | BR-01, BR-06, BR-37, BR-40                             |
| UC25.1 View Scheduling Menu                  | BR-01, BR-06, BR-40                                    |
| UC25.2 View Scheduling Menu Detail           | BR-01, BR-06, BR-40                                    |
| UC25.3 Create Schedule Menu                  | BR-01, BR-06, BR-17, BR-36, BR-37, BR-40               |
| UC25.4 Duplicate Menu                        | BR-01, BR-06, BR-36, BR-37, BR-40                      |
| UC25.5 Toggle Scheduling Menu                | BR-01, BR-06, BR-37, BR-40                             |
| UC_Order_06_Scan_QR_Code                     | BR-01, BR-06, BR-37, BR-38, BR-40                      |
| UC26.1 Register Canteen                      | BR-01, BR-06, BR-17, BR-37                             |
| UC26.2 View Canteen Detail                   | BR-31                                                  |
| UC26.3 Update Canteen                        | BR-01, BR-06, BR-17, BR-37, BR-40                      |
| UC26.4 View Canteen Schedule                 | BR-31, BR-40                                           |
| UC27.1 View Feedback                         | BR-31, BR-35                                           |
| UC27.2 Reply Feedback                        | BR-01, BR-06, BR-08, BR-40                             |
| UC28.1 View List of Staff                    | BR-01, BR-06, BR-40                                    |
| UC28.2 Add Staff                             | BR-01, BR-06, BR-11, BR-12, BR-17, BR-37, BR-40        |
| UC28.3 Update Staff                          | BR-01, BR-06, BR-12, BR-17, BR-40                      |
| UC28.4 View Detail Staff                     | BR-01, BR-06, BR-40                                    |
| UC29.1 View Staff Works Shift                | BR-01, BR-06, BR-39                                    |
| UC29.2 Save Draft Schedule                   | BR-01, BR-06, BR-17, BR-26, BR-36, BR-37, BR-40        |
| UC29.3 View Draft Schedule                   | BR-01, BR-06, BR-40                                    |
| UC29.4 Publish Schedule                      | BR-01, BR-06, BR-37, BR-40                             |
| UC29.5 View Shift Change Request             | BR-01, BR-06, BR-40                                    |
| UC29.6 Filter Shift Change Request           | BR-01, BR-06, BR-17, BR-40                             |
| UC29.7 Update Shift Change Request           | BR-01, BR-06, BR-17, BR-36, BR-37, BR-40               |
| UC30.1 View Payroll List                     | BR-01, BR-06, BR-40                                    |
| UC30.2 Filter/Search Payroll                 | BR-01, BR-06, BR-17, BR-40                             |
| UC30.3 Calculate Payroll                     | BR-01, BR-06, BR-17, BR-37, BR-40                      |
| UC30.4 View Salary Rate Configuration        | BR-01, BR-06, BR-40                                    |
| UC30.5 Set Salary Rate Configuration         | BR-01, BR-06, BR-17, BR-37, BR-40                      |
| UC30.6 View Salary Detail                    | BR-01, BR-06, BR-39, BR-40                             |
| UC30.7 Adjust Payroll (Salary)               | BR-01, BR-06, BR-17, BR-37, BR-40                      |
| UC30.8 Approve Payroll                       | BR-01, BR-06, BR-37, BR-40                             |
| UC31.1 View Activity Logs                    | BR-01, BR-06, BR-10, BR-40                             |
| UC31.2 View Audit Log Statistics             | BR-01, BR-06, BR-10, BR-40                             |
| UC31.3 View Audit Log Detail                 | BR-01, BR-06, BR-10, BR-40                             |
| UC31.4 Filter Activity Logs                  | BR-01, BR-06, BR-10, BR-17, BR-40                      |
| UC32.1 Inventory Management                  | BR-01, BR-06, BR-17, BR-23, BR-40                      |
| UC33.1 View List Ingredients                 | BR-01, BR-06, BR-40                                    |
| UC33.2 View Ingredient Detail                | BR-01, BR-06, BR-40                                    |
| UC33.3 Add Ingredient                        | BR-01, BR-06, BR-17, BR-40                             |
| UC33.4 Update Ingredient                     | BR-01, BR-06, BR-17, BR-40                             |
| UC33.5 Filter Ingredient                     | BR-01, BR-06, BR-17, BR-40                             |
| UC34.1 View Vouchers List                    | BR-01, BR-06, BR-40                                    |
| UC34.2 View Voucher Detail                   | BR-01, BR-06, BR-40                                    |
| UC34.3 Filter Voucher                        | BR-01, BR-06, BR-17, BR-40                             |
| UC34.4 Create Voucher                        | BR-01, BR-06, BR-17, BR-25, BR-33, BR-37, BR-40        |
| UC34.5 Update Voucher                        | BR-01, BR-06, BR-17, BR-25, BR-37, BR-40               |
| UC34.6 Delete Voucher                        | BR-01, BR-06, BR-37, BR-40                             |
| UC34.7 Clone Voucher                         | BR-01, BR-06, BR-37, BR-40                             |
| UC34.8 Archive Voucher                       | BR-01, BR-06, BR-37, BR-40                             |
| UC34.9 Publish Voucher                       | BR-01, BR-06, BR-37, BR-40                             |
| UC34.10 View Usage History                   | BR-01, BR-06, BR-40                                    |
| UC34.11 Reactivate/Deactivate Voucher        | BR-01, BR-06, BR-37, BR-40                             |
| UC35.1 View Recipe List                      | BR-01, BR-06, BR-40                                    |
| UC35.2 View Recipe Detail                    | BR-01, BR-06, BR-40                                    |
| UC35.3 Create Recipe                         | BR-01, BR-06, BR-17, BR-40                             |
| UC35.4 Update Recipe                         | BR-01, BR-06, BR-17, BR-40                             |
| UC36.1 View Global Order Metrics             | BR-01, BR-06, BR-40                                    |
| UC36.2 View Growth Summary                   | BR-01, BR-06, BR-40                                    |
| UC36.3 Revenue Aggregation                   | BR-01, BR-06, BR-40                                    |
| UC37.1 View System User                      | BR-01, BR-06, BR-40                                    |
| UC37.2 Create System User                    | BR-01, BR-06, BR-11, BR-12, BR-13, BR-17, BR-37, BR-40 |
| UC37.3 Update/Disable System User            | BR-01, BR-03, BR-04, BR-06, BR-17, BR-37, BR-40        |
| UC37.4 Assign Role to User                   | BR-01, BR-03, BR-06, BR-07, BR-37, BR-40               |
| UC38.1 Review Registration                   | BR-01, BR-06, BR-37, BR-40                             |
| UC39.1 View System Notifications             | BR-01, BR-06, BR-08, BR-40                             |
| UC39.2 View System Notification Detail       | BR-01, BR-06, BR-08, BR-40                             |
| UC39.3 Create System Notification            | BR-01, BR-06, BR-08, BR-17, BR-37, BR-40               |
| UC39.4 Update System Notification            | BR-01, BR-06, BR-08, BR-17, BR-37, BR-40               |
| UC39.5 Delete System Notification            | BR-01, BR-06, BR-08, BR-37, BR-40                      |
| UC38.2 View List Canteens                    | BR-31                                                  |
| UC40.1 View List Banners                     | BR-01, BR-06                                           |
| UC40.2 View Banner Detail                    | BR-01, BR-06                                           |
| UC40.3 Create Banner                         | BR-01, BR-06, BR-17, BR-37                             |
| UC40.4 Update Banner                         | BR-01, BR-06, BR-17, BR-37                             |
| UC40.5 Delete Banner                         | BR-01, BR-06, BR-37                                    |
| UC41.1 View List Permissions                 | BR-01, BR-06, BR-09                                    |
| UC41.2 View Permission Detail                | BR-01, BR-06, BR-09                                    |
| UC41.3 Create Permission                     | BR-01, BR-06, BR-09, BR-17                             |
| UC41.4 Update Permission                     | BR-01, BR-06, BR-09, BR-17                             |

---

## 4) Ghi chú chuẩn hóa

- Rule được trừu tượng hóa ở mức tái sử dụng đa UC, tránh câu chữ đặc thù từng flow.
- Rule trùng nghĩa đã được hợp nhất (đặc biệt nhóm auth, ownership, canteen scope, state machine).
- Mapping ưu tiên hành vi đã có trong code backend hiện tại; nếu Use Case mô tả rộng hơn code, mapping vẫn bám vào BR đã được chuẩn hóa theo triển khai thực tế.
