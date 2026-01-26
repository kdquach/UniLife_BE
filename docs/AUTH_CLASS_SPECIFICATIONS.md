# Authentication Module - Class Specifications

## Bảng Tổng Quan Các Class

| STT | Class Name     | Type       | Package     | Mô tả                                           |
| --- | -------------- | ---------- | ----------- | ----------------------------------------------- |
| 1   | AuthRoutes     | Module     | Routes      | Định nghĩa các API endpoints cho authentication |
| 2   | AuthController | Module     | Controllers | Xử lý HTTP request/response                     |
| 3   | AuthService    | Module     | Services    | Chứa business logic cho authentication          |
| 4   | AuthMiddleware | Middleware | Middlewares | Xác thực token và phân quyền                    |
| 5   | User           | Model      | Models      | Mongoose schema cho người dùng                  |
| 6   | Campus         | Model      | Models      | Mongoose schema cho campus                      |
| 7   | JwtUtils       | Utility    | Utilities   | Tạo và xác thực JWT token                       |
| 8   | OtpUtils       | Utility    | Utilities   | Quản lý OTP (tạo, lưu, xác thực)                |
| 9   | AppError       | Utility    | Utilities   | Custom error class                              |
| 10  | CatchAsync     | Utility    | Utilities   | Wrapper cho async functions                     |
| 11  | EmailConfig    | Config     | Config      | Cấu hình và gửi email                           |
| 12  | OAuth2Client   | External   | External    | Google OAuth2 authentication                    |

---

## b. Class Specifications

---

### **AuthRoutes Class**

_Class Methods_

| No  | Method                           | Description                                                                                                                                                                                |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01  | POST /register                   | Route đăng ký tài khoản (legacy). Input: fullName, email, password, phone. Output: user object và JWT token. Processing: Gọi authController.register()                                     |
| 02  | POST /register/send-otp          | Route gửi OTP để đăng ký. Input: fullName, email, password, phone. Output: success message và email. Processing: Gọi authController.sendRegisterOTP()                                      |
| 03  | POST /register/verify-otp        | Route xác thực OTP đăng ký. Input: email, otp. Output: user object và JWT token. Processing: Gọi authController.verifyRegisterOTP()                                                        |
| 04  | POST /login                      | Route đăng nhập. Input: email, password. Output: user object và JWT token. Processing: Gọi authController.login()                                                                          |
| 05  | POST /google                     | Route đăng nhập bằng Google. Input: idToken từ Google. Output: user object và JWT token. Processing: Gọi authController.googleAuth()                                                       |
| 06  | POST /forgot-password            | Route gửi OTP quên mật khẩu. Input: email. Output: success message. Processing: Gọi authController.forgotPassword()                                                                        |
| 07  | POST /forgot-password/verify-otp | Route xác thực OTP quên mật khẩu. Input: email, otp. Output: resetToken. Processing: Gọi authController.verifyForgotPasswordOTP()                                                          |
| 08  | POST /reset-password             | Route đặt lại mật khẩu. Input: email, resetToken, newPassword. Output: success message. Processing: Gọi authController.resetPassword()                                                     |
| 09  | POST /logout                     | Route đăng xuất (Protected). Input: JWT token trong header. Output: success message. Processing: Sử dụng protect middleware, gọi authController.logout()                                   |
| 10  | POST /change-password            | Route đổi mật khẩu (Protected). Input: currentPassword, newPassword, confirmPassword. Output: success message. Processing: Sử dụng protect middleware, gọi authController.changePassword() |

---

### **AuthController Class**

_Class Methods_

| No  | Method                            | Description                                                                                                                                                                                                 |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | sendRegisterOTP(req, res)         | Xử lý gửi OTP đăng ký. Input: req.body chứa {fullName, email, password, phone}. Output: JSON response với status 200, message và email. Processing: Gọi authService.sendRegisterOTP(), wrap bằng catchAsync |
| 02  | verifyRegisterOTP(req, res)       | Xác thực OTP và hoàn tất đăng ký. Input: req.body chứa {email, otp}. Output: JSON response với status 201, user object và JWT token. Processing: Gọi authService.verifyRegisterOTP()                        |
| 03  | register(req, res)                | Đăng ký tài khoản (legacy). Input: req.body chứa {fullName, email, password, phone, role?}. Output: JSON response với status 201, user và token. Processing: Gọi authService.register()                     |
| 04  | login(req, res)                   | Đăng nhập người dùng. Input: req.body chứa {email, password}. Output: JSON response với status 200, user và token. Processing: Gọi authService.login()                                                      |
| 05  | googleAuth(req, res)              | Đăng nhập/đăng ký bằng Google. Input: req.body chứa {idToken}. Output: JSON response với status 200, user và token. Processing: Gọi authService.googleAuth()                                                |
| 06  | forgotPassword(req, res)          | Gửi OTP quên mật khẩu. Input: req.body chứa {email}. Output: JSON response với status 200, message và email. Processing: Gọi authService.sendForgotPasswordOTP()                                            |
| 07  | verifyForgotPasswordOTP(req, res) | Xác thực OTP quên mật khẩu. Input: req.body chứa {email, otp}. Output: JSON response với status 200, resetToken và email. Processing: Gọi authService.verifyForgotPasswordOTP()                             |
| 08  | resetPassword(req, res)           | Đặt lại mật khẩu mới. Input: req.body chứa {email, resetToken, newPassword}. Output: JSON response với status 200 và success message. Processing: Gọi authService.resetPassword()                           |
| 09  | logout(req, res)                  | Đăng xuất người dùng. Input: JWT token từ header, req.user.\_id từ middleware. Output: JSON response với status 200 và success message. Processing: Lấy token từ header, gọi authService.logout()           |
| 10  | changePassword(req, res)          | Đổi mật khẩu. Input: req.user.\_id, req.body chứa {currentPassword, newPassword, confirmPassword}. Output: JSON response với status 200 và success message. Processing: Gọi authService.changePassword()    |

---

### **AuthService Class**

_Class Methods_

| No  | Method                        | Description                                                                                                                                                                                                                   |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | sendRegisterOTP(userData)     | Gửi OTP cho đăng ký. Input: {fullName, email, password, phone}. Output: {message, email}. Processing: Validate fields, kiểm tra email/phone tồn tại, kiểm tra cooldown OTP, generate OTP, lưu OTP với userData, gửi email OTP |
| 02  | verifyRegisterOTP(data)       | Xác thực OTP đăng ký. Input: {email, otp}. Output: {user, token}. Processing: Verify OTP, tạo user mới với emailVerified=true, generate JWT token                                                                             |
| 03  | resendRegisterOTP(email)      | Gửi lại OTP đăng ký. Input: email. Output: {message, email}. Processing: Kiểm tra cooldown, throw error nếu session hết hạn                                                                                                   |
| 04  | sendForgotPasswordOTP(email)  | Gửi OTP quên mật khẩu. Input: email. Output: {message, email}. Processing: Kiểm tra user tồn tại, kiểm tra provider, generate OTP, gửi email                                                                                  |
| 05  | verifyForgotPasswordOTP(data) | Xác thực OTP quên mật khẩu. Input: {email, otp}. Output: {message, resetToken, email}. Processing: Verify OTP, generate resetToken với expiry 10 phút                                                                         |
| 06  | resetPassword(data)           | Đặt lại mật khẩu. Input: {email, resetToken, newPassword}. Output: {message}. Processing: Verify resetToken, validate password length, cập nhật password                                                                      |
| 07  | register(userData)            | Đăng ký legacy. Input: {fullName, email, password, phone, role?}. Output: {user, token}. Processing: Validate, kiểm tra trùng lặp, tạo user, generate token                                                                   |
| 08  | login(credentials)            | Đăng nhập. Input: {email, password}. Output: {user, token}. Processing: Tìm user với password, so sánh password bằng bcrypt, generate token                                                                                   |
| 09  | googleAuth(idToken)           | Đăng nhập Google. Input: idToken từ Google. Output: {user, token}. Processing: Verify Google token, tìm/tạo user, link account nếu cần, generate JWT                                                                          |
| 10  | logout(token, userId)         | Đăng xuất. Input: JWT token, userId. Output: void. Processing: Thêm token vào blacklist                                                                                                                                       |
| 11  | changePassword(userId, data)  | Đổi mật khẩu. Input: userId, {currentPassword, newPassword, confirmPassword}. Output: {message}. Processing: Validate fields, kiểm tra match, verify current password, cập nhật password mới                                  |
| 12  | isTokenBlacklisted(token)     | Kiểm tra token blacklist. Input: JWT token. Output: boolean. Processing: Kiểm tra token có trong Set blacklist không                                                                                                          |
| 13  | verifyGoogleToken(idToken)    | (Private) Xác thực Google token. Input: idToken. Output: Google payload. Processing: Sử dụng OAuth2Client.verifyIdToken()                                                                                                     |
| 14  | addToBlacklist(token, userId) | (Private) Thêm vào blacklist. Input: token, userId. Output: void. Processing: Thêm token vào tokenBlacklist Set                                                                                                               |

---

### **AuthMiddleware Class**

_Class Methods_

| No  | Method                  | Description                                                                                                                                                                                                                |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | protect(req, res, next) | Middleware xác thực JWT. Input: req với Authorization header. Output: req.user được gán nếu valid. Processing: Lấy token từ header, kiểm tra blacklist, verify token bằng JwtUtils, tìm user, gán vào req.user, gọi next() |
| 02  | restrictTo(...roles)    | Middleware phân quyền. Input: Danh sách roles được phép. Output: Middleware function. Processing: Kiểm tra req.user.role có trong danh sách roles, throw 403 nếu không có quyền                                            |

---

### **User Class (Model)**

_Class Methods_

| No  | Method                             | Description                                                                                                                                                                         |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | comparePassword(candidatePassword) | So sánh mật khẩu. Input: candidatePassword (plain text). Output: boolean. Processing: Sử dụng bcrypt.compare() để so sánh với password đã hash trong database                       |
| 02  | pre('save')                        | Mongoose middleware trước khi save. Input: Không có (this context). Output: void. Processing: Kiểm tra password có modified không, nếu có thì hash password bằng bcrypt với cost 12 |

---

### **JwtUtils Class**

_Class Methods_

| No  | Method                             | Description                                                                                                                                                                         |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | generateToken(payload, expiresIn?) | Tạo JWT token. Input: payload object (thường là {id: userId}), expiresIn optional. Output: JWT token string. Processing: Sử dụng jwt.sign() với JWT_SECRET và JWT_EXPIRES_IN từ env |
| 02  | verifyToken(token)                 | Xác thực JWT token. Input: JWT token string. Output: Decoded payload object. Processing: Sử dụng jwt.verify() với JWT_SECRET, throw error nếu invalid                               |

---

### **OtpUtils Class**

_Class Methods_

| No  | Method                                | Description                                                                                                                                                                                                         |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | generateOTP()                         | Tạo mã OTP 6 số. Input: Không có. Output: String 6 chữ số. Processing: Sử dụng Math.random() để tạo số ngẫu nhiên từ 100000-999999                                                                                  |
| 02  | storeOTP(email, otp, type, userData?) | Lưu OTP. Input: email, otp code, type ('register'/'reset-password'), userData optional. Output: void. Processing: Tạo key từ type:email, lưu vào Map với expiry, setup auto-delete sau OTP_EXPIRY (5 phút)          |
| 03  | verifyOTP(email, otp, type)           | Xác thực OTP. Input: email, otp, type. Output: {valid: boolean, userData: Object?, message: string}. Processing: Lấy từ Map, kiểm tra expiry, kiểm tra attempts (max 5), so sánh OTP, xóa sau khi verify thành công |
| 04  | deleteOTP(email, type)                | Xóa OTP. Input: email, type. Output: void. Processing: Xóa entry khỏi Map                                                                                                                                           |
| 05  | canResendOTP(email, type)             | Kiểm tra có thể gửi lại OTP. Input: email, type. Output: {canResend: boolean, remainingTime: number}. Processing: Kiểm tra cooldown 60 giây từ lần gửi trước                                                        |

---

### **AppError Class**

_Class Methods_

| No  | Method                           | Description                                                                                                                                                                                                                       |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | constructor(message, statusCode) | Khởi tạo AppError. Input: message string, statusCode number. Output: AppError instance. Processing: Gọi super(message), set statusCode, set status ('fail' cho 4xx, 'error' cho 5xx), set isOperational=true, capture stack trace |

---

### **CatchAsync Class**

_Class Methods_

| No  | Method         | Description                                                                                                                                                                             |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | catchAsync(fn) | Wrapper cho async function. Input: Async function (req, res, next). Output: Function. Processing: Return function wrap fn trong Promise.resolve().catch(next) để tự động forward errors |

---

### **EmailConfig Class**

_Class Methods_

| No  | Method                           | Description                                                                                                                                                      |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | getTransporter()                 | Lấy email transporter. Input: Không có. Output: Nodemailer Transporter. Processing: Lazy initialization, tạo transporter với Gmail service và credentials từ env |
| 02  | sendEmail(options)               | Gửi email. Input: {to, subject, html}. Output: Promise<void>. Processing: Sử dụng transporter.sendMail() với mailOptions                                         |
| 03  | sendOTPEmail(email, otp)         | Gửi email OTP đăng ký. Input: email, otp. Output: Promise<void>. Processing: Tạo HTML template với OTP, gọi sendEmail()                                          |
| 04  | sendPasswordResetOTP(email, otp) | Gửi email OTP reset password. Input: email, otp. Output: Promise<void>. Processing: Tạo HTML template khác với OTP, gọi sendEmail()                              |

---

### **OAuth2Client Class (External)**

_Class Methods_

| No  | Method                 | Description                                                                                                                                                                                             |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | verifyIdToken(options) | Xác thực Google ID Token. Input: {idToken, audience}. Output: Promise<Ticket>. Processing: Xác thực token với Google servers, trả về ticket chứa payload với thông tin user (email, name, picture, sub) |

---

## Bảng Quan Hệ Giữa Các Class

| STT | From Class     | To Class       | Relationship Type        | Mô tả                                                        |
| --- | -------------- | -------------- | ------------------------ | ------------------------------------------------------------ |
| 1   | AuthRoutes     | AuthController | Dependency (Use)         | Routes import và sử dụng các method của Controller           |
| 2   | AuthRoutes     | AuthMiddleware | Dependency (Use)         | Routes sử dụng protect middleware cho các route cần xác thực |
| 3   | AuthController | AuthService    | Dependency (Use)         | Controller gọi các business method của Service               |
| 4   | AuthController | CatchAsync     | Dependency (Use)         | Controller wrap async functions bằng catchAsync              |
| 5   | AuthService    | User           | Association              | Service thực hiện CRUD operations trên User model            |
| 6   | AuthService    | JwtUtils       | Dependency (Use)         | Service sử dụng để generate JWT tokens                       |
| 7   | AuthService    | OtpUtils       | Dependency (Use)         | Service sử dụng để quản lý OTP                               |
| 8   | AuthService    | AppError       | Dependency (Throw)       | Service throw AppError khi có lỗi business logic             |
| 9   | AuthService    | EmailConfig    | Dependency (Use)         | Service gọi để gửi email OTP                                 |
| 10  | AuthService    | OAuth2Client   | Dependency (Use)         | Service sử dụng để verify Google token                       |
| 11  | AuthMiddleware | JwtUtils       | Dependency (Use)         | Middleware sử dụng để verify JWT token                       |
| 12  | AuthMiddleware | User           | Association              | Middleware query User để kiểm tra tồn tại                    |
| 13  | AuthMiddleware | AppError       | Dependency (Throw)       | Middleware throw AppError khi xác thực thất bại              |
| 14  | AuthMiddleware | AuthService    | Dependency (Use)         | Middleware gọi isTokenBlacklisted()                          |
| 15  | AuthMiddleware | CatchAsync     | Dependency (Use)         | Middleware wrap bằng catchAsync                              |
| 16  | AppError       | Error          | Generalization (Extends) | AppError kế thừa từ built-in Error class                     |
| 17  | User           | Campus         | Association (Reference)  | User có campusId tham chiếu đến Campus                       |

---

## Ký Hiệu UML Sử Dụng

| Ký hiệu     | Tên                  | Ý nghĩa                                    |
| ----------- | -------------------- | ------------------------------------------ |
| `──────>`   | Directed Association | Class A có reference/quan hệ với Class B   |
| `- - - ->`  | Dependency (Use)     | Class A phụ thuộc/sử dụng Class B          |
| `────────▷` | Generalization       | Class A kế thừa (extends) Class B          |
| `◆────────` | Composition          | Quan hệ chứa, B không tồn tại nếu A bị xóa |
| `◇────────` | Aggregation          | Quan hệ chứa, B có thể tồn tại độc lập     |
