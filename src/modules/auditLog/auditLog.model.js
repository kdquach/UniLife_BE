import mongoose from 'mongoose';

// Schema cho lưu trữ nhật ký hoạt động của hệ thống
const auditLogSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    action: {
      type: String,
      required: [true, 'Vui lòng nhập loại hành động'],
      enum: ['CREATE', 'UPDATE', 'DELETE', 'ERROR'],
      index: true,
    },
    module: {
      type: String,
      required: [true, 'Vui lòng nhập tên module'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả hành động'],
    },

    // Thông tin người dùng
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: String,
    userEmail: String,
    userRole: {
      type: String,
      enum: ['admin', 'staff', 'manager', 'customer'],
    },

    // Thông tin canteen
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      index: true,
    },

    // Thông tin tài nguyên bị tác động
    resourceType: {
      type: String,
      required: [true, 'Vui lòng nhập loại tài nguyên'],
      enum: [
        'Không xác định',
        'Người dùng',
        'Sản phẩm',
        'Danh mục sản phẩm',
        'Nguyên liệu',
        'Danh mục nguyên liệu',
        'Công thức',
        'Đơn hàng',
        'Thực đơn',
        'Lịch thực đơn',
        'Ca làm việc',
        'Chấm công',
        'Quyền hạn',
        'Quyền',
        'Phiếu giảm giá',
        'Banner',
        'Phản hồi',
        'Căn tin',
        'Bảng lương',
        'Lương',
        'Mức lương',
        'Lịch làm việc',
        'Đổi ca',
        'Trả lời phản hồi',
      ],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    resourceName: String,

    // Dữ liệu bị thay đổi
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Thông tin yêu cầu HTTP
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    endpoint: String,
    ipAddress: String,
    userAgent: String,
    statusCode: {
      type: Number,
      index: true,
    },

    // Chi tiết lỗi (nếu có)
    errorMessage: String,
    errorStack: String,

    // Thời gian
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index cho truy vấn nhanh
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 ngày
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ canteenId: 1, createdAt: -1 });

// Static method: Tạo nhật ký
auditLogSchema.statics.createLog = async function (logData) {
  try {
    const log = await this.create(logData);
    return log;
  } catch (error) {
    console.error('Lỗi khi tạo nhật ký audit:', error);
  }
};

// Static method: Lấy nhật ký theo người dùng
auditLogSchema.statics.findByUser = async function (userId, options = {}) {
  const { page = 1, limit = 20, days = 30 } = options;
  const skip = (page - 1) * limit;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    userId,
    createdAt: { $gte: startDate },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method: Lấy nhật ký theo tài nguyên
auditLogSchema.statics.findByResource = async function (
  resourceType,
  resourceId,
  options = {}
) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    resourceType,
    resourceId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema, 'auditlogs');

export default AuditLog;
