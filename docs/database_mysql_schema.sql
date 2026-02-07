-- =====================================================
-- UniLife Database Schema - MySQL Version
-- Chuyển đổi từ MongoDB sang MySQL
-- Ngày tạo: 04/02/2026
-- =====================================================

-- Xóa database cũ nếu tồn tại và tạo mới
DROP DATABASE IF EXISTS unilife_db;
CREATE DATABASE unilife_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE unilife_db;

-- =====================================================
-- 1. BẢNG CAMPUS - Cơ sở/Khuôn viên trường
-- =====================================================
CREATE TABLE campus (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên campus, VD: FPT University HCMC',
    code VARCHAR(10) NOT NULL UNIQUE COMMENT 'Mã campus, VD: HCM, HN, CT',
    address TEXT NOT NULL COMMENT 'Địa chỉ campus',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='Bảng lưu thông tin các campus';

-- =====================================================
-- 2. BẢNG CANTEEN - Căn tin
-- =====================================================
CREATE TABLE canteen (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    campus_id CHAR(36) NOT NULL COMMENT 'FK đến campus',
    name VARCHAR(100) NOT NULL COMMENT 'Tên căn tin',
    location VARCHAR(255) NOT NULL COMMENT 'Vị trí căn tin',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_campus_status (campus_id, status),
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng lưu thông tin căn tin';

-- =====================================================
-- 3. BẢNG USER - Người dùng
-- =====================================================
CREATE TABLE user (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email người dùng',
    password VARCHAR(255) COMMENT 'Mật khẩu đã mã hóa',
    full_name VARCHAR(100) NOT NULL COMMENT 'Họ và tên',
    phone VARCHAR(15) COMMENT 'Số điện thoại',
    gender ENUM('male', 'female', 'other') COMMENT 'Giới tính',
    avatar VARCHAR(500) COMMENT 'URL avatar',
    date_of_birth DATE COMMENT 'Ngày sinh',
    address VARCHAR(500) COMMENT 'Địa chỉ',
    balance DECIMAL(15, 2) DEFAULT 0 COMMENT 'Số dư tài khoản',
    role ENUM('admin', 'manager', 'staff', 'customer') DEFAULT 'customer',
    status ENUM('active', 'inactive', 'banned', 'pending') DEFAULT 'active',
    provider ENUM('local', 'google', 'facebook') DEFAULT 'local' COMMENT 'Phương thức đăng nhập',
    provider_id VARCHAR(255) COMMENT 'ID từ provider OAuth',
    email_verified BOOLEAN DEFAULT FALSE COMMENT 'Email đã xác thực chưa',
    email_verified_at TIMESTAMP NULL COMMENT 'Thời điểm xác thực email',
    last_login_at TIMESTAMP NULL COMMENT 'Thời điểm đăng nhập cuối',
    campus_id CHAR(36) COMMENT 'FK đến campus của user',
    canteen_id CHAR(36) COMMENT 'FK đến canteen (cho staff)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    FULLTEXT INDEX idx_fulltext_search (full_name, email),
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE SET NULL,
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng lưu thông tin người dùng';

-- =====================================================
-- 4. BẢNG TOKEN - Lưu token xác thực
-- =====================================================
CREATE TABLE token (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user',
    token VARCHAR(500) NOT NULL UNIQUE COMMENT 'Token string',
    type ENUM('refresh', 'reset_password', 'verify_email') NOT NULL COMMENT 'Loại token',
    expires_at TIMESTAMP NOT NULL COMMENT 'Thời điểm hết hạn',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_type (user_id, type),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng lưu token xác thực';

-- =====================================================
-- 5. BẢNG OTP - Mã OTP xác thực
-- =====================================================
CREATE TABLE otp (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL COMMENT 'Email nhận OTP',
    otp VARCHAR(10) NOT NULL COMMENT 'Mã OTP',
    type ENUM('register', 'reset_password', 'login', 'verify') NOT NULL,
    expires_at TIMESTAMP NOT NULL COMMENT 'Thời điểm hết hạn',
    verified BOOLEAN DEFAULT FALSE COMMENT 'Đã xác thực chưa',
    attempts INT DEFAULT 0 COMMENT 'Số lần thử',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email_type (email, type),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB COMMENT='Bảng lưu mã OTP';

-- =====================================================
-- 6. BẢNG PRODUCT_CATEGORY - Danh mục sản phẩm
-- =====================================================
CREATE TABLE product_category (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên danh mục',
    description VARCHAR(500) COMMENT 'Mô tả danh mục',
    icon VARCHAR(255) COMMENT 'URL icon',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB COMMENT='Bảng danh mục sản phẩm';

-- =====================================================
-- 7. BẢNG INGREDIENT_CATEGORY - Danh mục nguyên liệu
-- =====================================================
CREATE TABLE ingredient_category (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên danh mục nguyên liệu',
    description VARCHAR(500) COMMENT 'Mô tả',
    icon VARCHAR(255) COMMENT 'URL icon',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB COMMENT='Bảng danh mục nguyên liệu';

-- =====================================================
-- 8. BẢNG INGREDIENT - Nguyên liệu
-- =====================================================
CREATE TABLE ingredient (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    category_id CHAR(36) NOT NULL COMMENT 'FK đến ingredient_category',
    name VARCHAR(100) NOT NULL COMMENT 'Tên nguyên liệu',
    stock DECIMAL(15, 2) DEFAULT 0 COMMENT 'Số lượng tồn kho',
    unit VARCHAR(50) NOT NULL COMMENT 'Đơn vị tính',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canteen_name (canteen_id, name),
    INDEX idx_category (category_id),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES ingredient_category(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng nguyên liệu';

-- =====================================================
-- 9. BẢNG PRODUCT - Sản phẩm
-- =====================================================
CREATE TABLE product (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    category_id CHAR(36) NOT NULL COMMENT 'FK đến product_category',
    name VARCHAR(200) NOT NULL COMMENT 'Tên sản phẩm',
    slug VARCHAR(250) COMMENT 'Slug URL',
    price DECIMAL(15, 2) NOT NULL COMMENT 'Giá bán',
    original_price DECIMAL(15, 2) COMMENT 'Giá gốc',
    status ENUM('available', 'unavailable', 'out_of_stock', 'hidden') DEFAULT 'available',
    description TEXT COMMENT 'Mô tả sản phẩm',
    image VARCHAR(500) COMMENT 'URL ảnh chính',
    calories INT COMMENT 'Lượng calo',
    preparation_time INT COMMENT 'Thời gian chuẩn bị (phút)',
    is_popular BOOLEAN DEFAULT FALSE COMMENT 'Sản phẩm phổ biến',
    is_new BOOLEAN DEFAULT TRUE COMMENT 'Sản phẩm mới',
    stock_quantity INT DEFAULT 0 COMMENT 'Số lượng tồn kho',
    low_stock_threshold INT DEFAULT 10 COMMENT 'Ngưỡng cảnh báo hết hàng',
    total_sold INT DEFAULT 0 COMMENT 'Tổng số đã bán',
    rating_average DECIMAL(3, 2) DEFAULT 0 COMMENT 'Điểm đánh giá trung bình',
    rating_count INT DEFAULT 0 COMMENT 'Số lượt đánh giá',
    display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canteen (canteen_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_slug (slug),
    INDEX idx_popular_sold (is_popular, total_sold DESC),
    FULLTEXT INDEX idx_fulltext (name, description),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_category(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng sản phẩm';

-- =====================================================
-- 10. BẢNG PRODUCT_IMAGE - Ảnh sản phẩm (nhiều ảnh)
-- =====================================================
CREATE TABLE product_image (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    image_url VARCHAR(500) NOT NULL COMMENT 'URL ảnh',
    display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product (product_id),
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng ảnh sản phẩm';

-- =====================================================
-- 11. BẢNG RECIPE - Công thức (Product - Ingredient)
-- =====================================================
CREATE TABLE recipe (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    ingredient_id CHAR(36) NOT NULL COMMENT 'FK đến ingredient',
    quantity DECIMAL(10, 2) NOT NULL COMMENT 'Số lượng nguyên liệu',
    unit VARCHAR(50) NOT NULL COMMENT 'Đơn vị',
    description VARCHAR(200) COMMENT 'Mô tả thêm',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_product_ingredient (product_id, ingredient_id),
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng công thức nấu ăn';

-- =====================================================
-- 12. BẢNG MENU - Thực đơn theo ngày
-- =====================================================
CREATE TABLE menu (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    date DATE NOT NULL COMMENT 'Ngày của thực đơn',
    status ENUM('draft', 'active', 'inactive') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canteen_date (canteen_id, date),
    INDEX idx_status (status),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng thực đơn theo ngày';

-- =====================================================
-- 13. BẢNG MENU_ITEM - Chi tiết thực đơn
-- =====================================================
CREATE TABLE menu_item (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    menu_id CHAR(36) NOT NULL COMMENT 'FK đến menu',
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_menu (menu_id),
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng chi tiết thực đơn';

-- =====================================================
-- 14. BẢNG VOUCHER - Mã giảm giá
-- =====================================================
CREATE TABLE voucher (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã voucher',
    discount_type ENUM('percentage', 'fixed') NOT NULL COMMENT 'Loại giảm giá',
    value DECIMAL(15, 2) NOT NULL COMMENT 'Giá trị giảm',
    min_order_amount DECIMAL(15, 2) DEFAULT 0 COMMENT 'Đơn hàng tối thiểu',
    max_discount DECIMAL(15, 2) COMMENT 'Giảm tối đa',
    max_usage INT COMMENT 'Số lần sử dụng tối đa (NULL = không giới hạn)',
    used_count INT DEFAULT 0 COMMENT 'Số lần đã sử dụng',
    start_date DATETIME NOT NULL COMMENT 'Ngày bắt đầu',
    end_date DATETIME NOT NULL COMMENT 'Ngày kết thúc',
    is_active BOOLEAN DEFAULT TRUE,
    campus_id CHAR(36) COMMENT 'FK đến campus (NULL = toàn bộ)',
    user_usage_limit INT DEFAULT 1 COMMENT 'Giới hạn sử dụng mỗi user',
    apply_to ENUM('all', 'specific_products') DEFAULT 'all' COMMENT 'Áp dụng cho',
    description VARCHAR(500) COMMENT 'Mô tả voucher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active (is_active),
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng mã giảm giá';

-- =====================================================
-- 15. BẢNG VOUCHER_PRODUCT - Sản phẩm áp dụng voucher
-- =====================================================
CREATE TABLE voucher_product (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    voucher_id CHAR(36) NOT NULL COMMENT 'FK đến voucher',
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_voucher_product (voucher_id, product_id),
    FOREIGN KEY (voucher_id) REFERENCES voucher(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng sản phẩm áp dụng voucher';

-- =====================================================
-- 16. BẢNG CART - Giỏ hàng
-- =====================================================
CREATE TABLE cart (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user',
    canteen_id CHAR(36) COMMENT 'FK đến canteen',
    total_price DECIMAL(15, 2) DEFAULT 0 COMMENT 'Tổng tiền giỏ hàng',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_canteen (user_id, canteen_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng giỏ hàng';

-- =====================================================
-- 17. BẢNG CART_ITEM - Chi tiết giỏ hàng
-- =====================================================
CREATE TABLE cart_item (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    cart_id CHAR(36) NOT NULL COMMENT 'FK đến cart',
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    quantity INT NOT NULL DEFAULT 1 COMMENT 'Số lượng',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_cart_product (cart_id, product_id),
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng chi tiết giỏ hàng';

-- =====================================================
-- 18. BẢNG WISHLIST - Danh sách yêu thích
-- =====================================================
CREATE TABLE wishlist (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE COMMENT 'FK đến user (1 user = 1 wishlist)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng danh sách yêu thích';

-- =====================================================
-- 19. BẢNG WISHLIST_ITEM - Chi tiết wishlist
-- =====================================================
CREATE TABLE wishlist_item (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    wishlist_id CHAR(36) NOT NULL COMMENT 'FK đến wishlist',
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_wishlist_product (wishlist_id, product_id),
    FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng chi tiết wishlist';

-- =====================================================
-- 20. BẢNG ORDER - Đơn hàng
-- =====================================================
CREATE TABLE `order` (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã đơn hàng',
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user (khách hàng)',
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    staff_id CHAR(36) COMMENT 'FK đến user (nhân viên xử lý)',
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    sub_total DECIMAL(15, 2) NOT NULL COMMENT 'Tổng tiền sản phẩm',
    discount DECIMAL(15, 2) DEFAULT 0 COMMENT 'Giảm giá',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT 'Tổng tiền thanh toán',
    voucher_id CHAR(36) COMMENT 'FK đến voucher',
    voucher_code VARCHAR(20) COMMENT 'Mã voucher đã dùng',
    -- Payment info
    payment_method ENUM('cash', 'momo', 'vnpay', 'sepay', 'balance', 'bank_transfer') COMMENT 'Phương thức thanh toán',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_transaction_id VARCHAR(100) COMMENT 'Mã giao dịch',
    payment_amount DECIMAL(15, 2) COMMENT 'Số tiền đã thanh toán',
    paid_at TIMESTAMP NULL COMMENT 'Thời điểm thanh toán',
    refund_amount DECIMAL(15, 2) DEFAULT 0 COMMENT 'Số tiền hoàn',
    refunded_at TIMESTAMP NULL COMMENT 'Thời điểm hoàn tiền',
    -- Pickup QR code
    pickup_qr_code VARCHAR(100) COMMENT 'Mã QR lấy hàng',
    pickup_qr_expire_at TIMESTAMP NULL COMMENT 'Thời hạn QR',
    pickup_qr_scanned_at TIMESTAMP NULL COMMENT 'Thời điểm quét QR',
    pickup_qr_scanned_by CHAR(36) COMMENT 'FK đến user (người quét)',
    -- Order details
    note VARCHAR(500) COMMENT 'Ghi chú đơn hàng',
    estimated_time INT COMMENT 'Thời gian dự kiến (phút)',
    prepared_at TIMESTAMP NULL COMMENT 'Thời điểm chuẩn bị xong',
    completed_at TIMESTAMP NULL COMMENT 'Thời điểm hoàn thành',
    cancelled_at TIMESTAMP NULL COMMENT 'Thời điểm hủy',
    cancel_reason VARCHAR(500) COMMENT 'Lý do hủy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_canteen (canteen_id),
    INDEX idx_staff (staff_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at DESC),
    INDEX idx_qr_code (pickup_qr_code),
    INDEX idx_order_number (order_number),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES user(id) ON DELETE SET NULL,
    FOREIGN KEY (voucher_id) REFERENCES voucher(id) ON DELETE SET NULL,
    FOREIGN KEY (pickup_qr_scanned_by) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng đơn hàng';

-- =====================================================
-- 21. BẢNG ORDER_ITEM - Chi tiết đơn hàng
-- =====================================================
CREATE TABLE order_item (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id CHAR(36) NOT NULL COMMENT 'FK đến order',
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    product_name VARCHAR(200) NOT NULL COMMENT 'Tên sản phẩm tại thời điểm đặt',
    quantity INT NOT NULL COMMENT 'Số lượng',
    price DECIMAL(15, 2) NOT NULL COMMENT 'Giá tại thời điểm đặt',
    note VARCHAR(200) COMMENT 'Ghi chú món',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_order (order_id),
    FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng chi tiết đơn hàng';

-- =====================================================
-- 22. BẢNG FEEDBACK - Đánh giá sản phẩm
-- =====================================================
CREATE TABLE feedback (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user',
    product_id CHAR(36) NOT NULL COMMENT 'FK đến product',
    order_id CHAR(36) NOT NULL COMMENT 'FK đến order',
    rating INT NOT NULL COMMENT 'Điểm đánh giá 1-5',
    comment TEXT COMMENT 'Nội dung đánh giá',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_product (product_id),
    INDEX idx_order (order_id),
    INDEX idx_rating (rating),
    UNIQUE KEY uk_user_order (user_id, order_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB COMMENT='Bảng đánh giá sản phẩm';

-- =====================================================
-- 23. BẢNG FEEDBACK_REPLY - Phản hồi đánh giá
-- =====================================================
CREATE TABLE feedback_reply (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    feedback_id CHAR(36) NOT NULL COMMENT 'FK đến feedback',
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user (người phản hồi)',
    reply TEXT NOT NULL COMMENT 'Nội dung phản hồi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_feedback (feedback_id),
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng phản hồi đánh giá';

-- =====================================================
-- 24. BẢNG NOTIFICATION - Thông báo người dùng
-- =====================================================
CREATE TABLE notification (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) COMMENT 'FK đến canteen',
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user',
    type ENUM('order', 'promotion', 'system', 'feedback', 'shift', 'salary') NOT NULL,
    title VARCHAR(200) NOT NULL COMMENT 'Tiêu đề',
    content TEXT NOT NULL COMMENT 'Nội dung',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
    read_at TIMESTAMP NULL COMMENT 'Thời điểm đọc',
    metadata JSON COMMENT 'Dữ liệu bổ sung (orderId, ...)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng thông báo người dùng';

-- =====================================================
-- 25. BẢNG SYSTEM_NOTIFICATION - Thông báo hệ thống
-- =====================================================
CREATE TABLE system_notification (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) COMMENT 'FK đến canteen',
    title VARCHAR(200) NOT NULL COMMENT 'Tiêu đề',
    content TEXT NOT NULL COMMENT 'Nội dung',
    target_role ENUM('all', 'admin', 'staff', 'customer') DEFAULT 'all',
    active_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm bắt đầu',
    active_to TIMESTAMP NULL COMMENT 'Thời điểm kết thúc',
    is_active BOOLEAN DEFAULT TRUE,
    created_by CHAR(36) COMMENT 'FK đến user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active_dates (is_active, active_from, active_to),
    INDEX idx_role (target_role),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng thông báo hệ thống';

-- =====================================================
-- 26. BẢNG BANNER - Banner quảng cáo
-- =====================================================
CREATE TABLE banner (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) COMMENT 'FK đến canteen',
    title VARCHAR(200) NOT NULL COMMENT 'Tiêu đề banner',
    image_url VARCHAR(500) NOT NULL COMMENT 'URL ảnh',
    link_url VARCHAR(500) COMMENT 'URL liên kết khi click',
    display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP NULL COMMENT 'Ngày bắt đầu hiển thị',
    end_date TIMESTAMP NULL COMMENT 'Ngày kết thúc hiển thị',
    created_by CHAR(36) COMMENT 'FK đến user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canteen (canteen_id),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng banner quảng cáo';

-- =====================================================
-- 27. BẢNG SHIFT - Ca làm việc
-- =====================================================
CREATE TABLE shift (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    name VARCHAR(100) NOT NULL COMMENT 'Tên ca',
    start_time TIME NOT NULL COMMENT 'Giờ bắt đầu',
    end_time TIME NOT NULL COMMENT 'Giờ kết thúc',
    day_of_week JSON COMMENT 'Các ngày trong tuần [0-6]',
    max_staff INT DEFAULT 5 COMMENT 'Số nhân viên tối đa',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canteen (canteen_id),
    INDEX idx_status (status),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng ca làm việc';

-- =====================================================
-- 28. BẢNG STAFF_SHIFT - Phân công ca cho nhân viên
-- =====================================================
CREATE TABLE staff_shift (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    shift_id CHAR(36) NOT NULL COMMENT 'FK đến shift',
    staff_id CHAR(36) NOT NULL COMMENT 'FK đến user (nhân viên)',
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    date DATE NOT NULL COMMENT 'Ngày làm việc',
    status ENUM('scheduled', 'checked_in', 'checked_out', 'absent', 'cancelled') DEFAULT 'scheduled',
    check_in_time TIMESTAMP NULL COMMENT 'Thời điểm check-in',
    check_out_time TIMESTAMP NULL COMMENT 'Thời điểm check-out',
    actual_work_hours DECIMAL(5, 2) DEFAULT 0 COMMENT 'Số giờ làm thực tế',
    notes VARCHAR(500) COMMENT 'Ghi chú',
    assigned_by CHAR(36) COMMENT 'FK đến user (người phân công)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_shift (shift_id),
    INDEX idx_staff (staff_id),
    INDEX idx_canteen (canteen_id),
    INDEX idx_date (date),
    FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng phân công ca làm việc';

-- =====================================================
-- 29. BẢNG SALARY - Bảng lương
-- =====================================================
CREATE TABLE salary (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user (nhân viên)',
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    period_start DATE NOT NULL COMMENT 'Ngày bắt đầu kỳ lương',
    period_end DATE NOT NULL COMMENT 'Ngày kết thúc kỳ lương',
    total_hours DECIMAL(10, 2) DEFAULT 0 COMMENT 'Tổng giờ làm',
    base_salary DECIMAL(15, 2) NOT NULL COMMENT 'Lương cơ bản',
    bonus DECIMAL(15, 2) DEFAULT 0 COMMENT 'Thưởng',
    deduction DECIMAL(15, 2) DEFAULT 0 COMMENT 'Khấu trừ',
    total_salary DECIMAL(15, 2) DEFAULT 0 COMMENT 'Tổng lương',
    status ENUM('pending', 'calculated', 'approved', 'paid') DEFAULT 'pending',
    calculated_at TIMESTAMP NULL COMMENT 'Thời điểm tính lương',
    paid_at TIMESTAMP NULL COMMENT 'Thời điểm trả lương',
    note TEXT COMMENT 'Ghi chú',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_period (user_id, period_start, period_end),
    INDEX idx_canteen (canteen_id),
    INDEX idx_status (status),
    INDEX idx_period (period_start, period_end),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng lương nhân viên';

-- =====================================================
-- 30. BẢNG REPORT_SNAPSHOT - Báo cáo định kỳ
-- =====================================================
CREATE TABLE report_snapshot (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    canteen_id CHAR(36) NOT NULL COMMENT 'FK đến canteen',
    report_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
    report_name VARCHAR(200) NOT NULL COMMENT 'Tên báo cáo',
    period_start DATE NOT NULL COMMENT 'Ngày bắt đầu',
    period_end DATE NOT NULL COMMENT 'Ngày kết thúc',
    -- Dữ liệu báo cáo lưu dạng JSON
    data JSON COMMENT 'Dữ liệu báo cáo chi tiết',
    generated_by CHAR(36) COMMENT 'FK đến user',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_canteen_type_period (canteen_id, report_type, period_start),
    INDEX idx_created (created_at DESC),
    FOREIGN KEY (canteen_id) REFERENCES canteen(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng báo cáo định kỳ';

-- =====================================================
-- 31. BẢNG AUDIT_LOG - Nhật ký hệ thống
-- =====================================================
CREATE TABLE audit_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL COMMENT 'FK đến user thực hiện',
    action VARCHAR(100) NOT NULL COMMENT 'Hành động thực hiện',
    entity_type VARCHAR(50) NOT NULL COMMENT 'Loại đối tượng (product, order, ...)',
    entity_id CHAR(36) COMMENT 'ID đối tượng',
    old_data JSON COMMENT 'Dữ liệu trước thay đổi',
    new_data JSON COMMENT 'Dữ liệu sau thay đổi',
    ip_address VARCHAR(45) COMMENT 'Địa chỉ IP',
    user_agent TEXT COMMENT 'User agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng nhật ký hệ thống';

-- =====================================================
-- VIEW: Thống kê đơn hàng theo căn tin
-- =====================================================
CREATE VIEW v_canteen_order_stats AS
SELECT 
    c.id AS canteen_id,
    c.name AS canteen_name,
    COUNT(o.id) AS total_orders,
    SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) AS total_revenue,
    AVG(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE NULL END) AS avg_order_value
FROM canteen c
LEFT JOIN `order` o ON c.id = o.canteen_id
GROUP BY c.id, c.name;

-- =====================================================
-- VIEW: Thống kê sản phẩm bán chạy
-- =====================================================
CREATE VIEW v_top_products AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.canteen_id,
    c.name AS canteen_name,
    p.total_sold,
    p.rating_average,
    p.rating_count,
    p.price
FROM product p
JOIN canteen c ON p.canteen_id = c.id
WHERE p.status = 'available'
ORDER BY p.total_sold DESC;

-- =====================================================
-- KẾT THÚC SCHEMA
-- =====================================================
