Repository này là Backend API cho hệ thống đặt món.

Công nghệ:

- NodeJS v18
- Express
- MongoDB

Quy tắc bắt buộc:

- Tái sử dụng service nếu đã tồn tại
- Luôn phản hồi chat bằng tiếng việt
- Luôn khi code Comment bằng tiếng Việt và không chứa icon
- Dùng arrow function
- Không hard-code
- Controller không chứa logic nghiệp vụ
- Luôn kiểm tra quyền và validate dữ liệu
- Luôn code đồng nhất format với dự án

Luồng chuẩn:
Route → Middleware → Controller → Service → Model

Ưu tiên:

- Code an toàn, dễ hiểu
- Dễ test
- Dễ mở rộng

Luôn chạy:
npm install
npm run lint
npm test (nếu có)
