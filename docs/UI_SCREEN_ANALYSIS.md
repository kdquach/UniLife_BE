# Phân tích màn hình chính toàn hệ thống

## Client App (UniLife_Client_FE)

| #   | Feature            | Screen                           | Description                                                                                                  |
| --- | ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Authentication     | Login                            | Cho phép người dùng đăng nhập bằng email/mật khẩu hoặc Google; có validate và thông báo lỗi đăng nhập.       |
| 2   | Authentication     | Register                         | Cho phép tạo tài khoản mới, nhập thông tin cơ bản và chuyển sang bước xác thực OTP.                          |
| 3   | Authentication     | Verify OTP                       | Xác thực mã OTP sau đăng ký để kích hoạt tài khoản trước khi sử dụng hệ thống.                               |
| 4   | Authentication     | Forgot Password                  | Cho phép yêu cầu quên mật khẩu bằng email để bắt đầu luồng đặt lại mật khẩu.                                 |
| 5   | Authentication     | Verify Forgot Password OTP       | Xác thực OTP trong luồng quên mật khẩu trước khi cho phép đặt mật khẩu mới.                                  |
| 6   | Authentication     | Reset Password                   | Đặt mật khẩu mới sau khi OTP hợp lệ để khôi phục quyền truy cập tài khoản.                                   |
| 7   | Home & Navigation  | Home                             | Trang vào hệ thống, hiển thị nội dung giới thiệu và điều hướng nhanh sang đăng nhập/menu.                    |
| 8   | Product Browsing   | Menu                             | Hiển thị danh sách món theo canteen, hỗ trợ tìm kiếm, lọc danh mục, sắp xếp, thêm giỏ hàng và yêu thích.     |
| 9   | Product Browsing   | Product Detail                   | Hiển thị chi tiết món (ảnh, giá, trạng thái còn hàng), cho chọn số lượng và thêm vào giỏ hàng.               |
| 10  | Favorites          | Favorite                         | Hiển thị danh sách món yêu thích và cho phép bỏ yêu thích từng món hoặc xóa danh sách.                       |
| 11  | Order Management   | Order History (kèm Order Detail) | Hiển thị lịch sử đơn theo trạng thái, phân trang; người dùng mở chi tiết đơn ngay trong cùng luồng màn hình. |
| 12  | Notification       | Notification Detail              | Hiển thị nội dung chi tiết một thông báo và dữ liệu liên quan theo ID thông báo.                             |
| 13  | Profile Management | Profile                          | Hiển thị và cập nhật thông tin cá nhân, avatar; hỗ trợ đổi mật khẩu và theo dõi mức hoàn thiện hồ sơ.        |

## Dashboard App (UniLife_Dashboard_FE)

| #   | Feature               | Screen                    | Description                                                                              |
| --- | --------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| 14  | Authentication        | Login                     | Đăng nhập khu vực vận hành/quản trị; phân quyền theo vai trò staff/manager/admin.        |
| 15  | Admin Dashboard       | Dashboard                 | Màn hình tổng quan vận hành với các chỉ số nhanh và danh sách thông tin nổi bật.         |
| 16  | Profile Management    | Profile                   | Quản lý hồ sơ người dùng nội bộ, cập nhật thông tin cá nhân và đổi mật khẩu.             |
| 17  | Staff Scheduling      | Staff Schedule            | Nhân viên xem lịch làm theo tuần/ca và theo dõi các ca đã được phân công.                |
| 18  | Attendance            | Staff Attendance          | Nhân viên thực hiện check-in/check-out theo ca, hệ thống ghi nhận trạng thái chấm công.  |
| 19  | Attendance            | Attendance History        | Tra cứu lịch sử chấm công theo thời gian/trạng thái và xem chi tiết từng bản ghi.        |
| 20  | Order Fulfillment     | Pending Pickup Orders     | Nhân viên quầy xử lý đơn chờ nhận, theo dõi trạng thái đơn và xem chi tiết đơn hàng.     |
| 21  | Order Fulfillment     | QR Scan Screen            | Quét QR hoặc nhập mã để xác nhận khách nhận món và hoàn tất quy trình giao đơn.          |
| 22  | Shift Management      | Manager Schedule Builder  | Quản lý lập lịch ca cho đội ngũ, sắp xếp ca và phát hành lịch làm việc.                  |
| 23  | Shift Management      | Shift Requests Management | Quản lý yêu cầu đổi ca, duyệt hoặc từ chối theo chính sách vận hành.                     |
| 24  | Product Management    | Product Management        | Quản lý danh sách món (CRUD), tìm kiếm/lọc, cập nhật trạng thái và thông tin hiển thị.   |
| 25  | Ingredient Management | Ingredient Management     | Quản lý nguyên liệu (CRUD), định mức tồn kho và thông tin phục vụ vận hành bếp.          |
| 26  | Recipe Management     | Recipe Management         | Quản lý công thức món theo nguyên liệu và định lượng để đồng bộ chế biến.                |
| 27  | Inventory Management  | Inventory Dashboard       | Theo dõi cảnh báo tồn kho thấp/hết và hỗ trợ thao tác điều chỉnh nhanh.                  |
| 28  | Menu Management       | Menu Management           | Quản lý menu hiện hành, tạo/sửa/xóa menu và cấu trúc danh sách món theo menu.            |
| 29  | Menu Management       | Assign Food To Menu       | Gán món vào menu cụ thể để triển khai thực đơn theo từng ngữ cảnh vận hành.              |
| 30  | Menu Management       | Menu Schedules            | Lập lịch áp dụng menu theo ngày/ca để tự động hóa phục vụ theo khung thời gian.          |
| 31  | Voucher Management    | Voucher Management        | Quản lý vòng đời voucher: tạo, chỉnh sửa, tìm kiếm/lọc và kiểm soát trạng thái sử dụng.  |
| 32  | Voucher Management    | Voucher Detail            | Xem thông tin chi tiết voucher và dữ liệu sử dụng liên quan cho mục đích theo dõi.       |
| 33  | Payroll Management    | Payroll List              | Quản lý danh sách kỳ lương, tạo và theo dõi trạng thái xử lý bảng lương.                 |
| 34  | Payroll Management    | Payroll Detail            | Xem chi tiết lương theo nhân viên/kỳ lương và thực hiện các thao tác xác nhận liên quan. |
| 35  | Salary Configuration  | Salary Rate Management    | Cấu hình mức lương/đơn giá áp dụng cho vị trí hoặc điều kiện làm việc khác nhau.         |
| 36  | Staff Management      | Staff Management          | Quản lý hồ sơ nhân sự nội bộ, trạng thái làm việc và thông tin vận hành liên quan.       |
| 37  | Category Management   | Product Categories        | Quản lý danh mục sản phẩm để chuẩn hóa phân loại món trong hệ thống.                     |
| 38  | Category Management   | Ingredient Categories     | Quản lý danh mục nguyên liệu để chuẩn hóa nhóm nguyên liệu cho kho và công thức.         |
| 39  | Notification          | Notification Center       | Quản lý và theo dõi thông báo nội bộ cho nhân viên/đơn vị vận hành.                      |
| 40  | Audit & Compliance    | Audit Log                 | Theo dõi nhật ký hoạt động hệ thống, tra cứu sự kiện và hỗ trợ kiểm tra vận hành.        |
| 41  | Canteen Management    | Canteen Management        | Quản lý thông tin căng tin/điểm bán phục vụ cấu hình và vận hành đa cơ sở.               |

## Tóm tắt feature chính

Hệ thống có 3 nhóm chức năng lớn: (1) ứng dụng người dùng cuối để xác thực, duyệt món, đặt món, theo dõi đơn và quản lý hồ sơ; (2) ứng dụng vận hành cho staff để quản lý lịch ca, chấm công, xử lý đơn tại quầy; (3) ứng dụng quản trị cho manager/admin để quản lý menu, sản phẩm, nguyên liệu, công thức, voucher, nhân sự, lương, thông báo và audit log.
