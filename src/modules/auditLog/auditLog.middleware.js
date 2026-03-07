import AuditLog from './auditLog.model.js';
import * as auditLogService from './auditLog.service.js';

// Mapping từ endpoint path tới tên module và resource type
const getAuditLogInfo = (req) => {
  const pathSegments = req.path.split('/').filter((seg) => seg);
  const apiIndex = pathSegments.indexOf('api');
  const moduleName = apiIndex !== -1 ? pathSegments[apiIndex + 1] : 'unknown';

  const resourceTypeMap = {
    auth: { module: 'Auth', resourceType: 'User' },
    users: { module: 'User', resourceType: 'User' },
    products: { module: 'Product', resourceType: 'Product' },
    ingredients: { module: 'Ingredient', resourceType: 'Ingredient' },
    recipes: { module: 'Recipe', resourceType: 'Recipe' },
    orders: { module: 'Order', resourceType: 'Order' },
    menus: { module: 'Menu', resourceType: 'Menu' },
    shifts: { module: 'Shift', resourceType: 'Shift' },
    roles: { module: 'Role', resourceType: 'Role' },
    vouchers: { module: 'Voucher', resourceType: 'Voucher' },
    banners: { module: 'Banner', resourceType: 'Banner' },
    feedback: { module: 'Feedback', resourceType: 'Feedback' },
    feedbacks: { module: 'Feedback', resourceType: 'Feedback' },
    profile: { module: 'Profile', resourceType: 'User' },
    canteens: { module: 'Canteen', resourceType: 'Canteen' },
  };

  return (
    resourceTypeMap[moduleName] || {
      module: moduleName,
      resourceType: 'Unknown',
    }
  );
};

// Xác định hành động từ HTTP method và endpoint
const getAuditAction = (req) => {
  const method = req.method;
  const path = req.path;

  if (method === 'GET') {
    return 'READ';
  } else if (method === 'POST') {
    return 'CREATE';
  } else if (method === 'PUT' || method === 'PATCH') {
    return 'UPDATE';
  } else if (method === 'DELETE') {
    return 'DELETE';
  }

  return 'UNKNOWN';
};

// Lưu trữ dữ liệu cũ từ request body
export const captureOldValues = (req, res, next) => {
  if (req.method === 'PATCH' || req.method === 'PUT') {
    req.oldAuditValues = { ...req.body };
  }
  next();
};

// Middleware: Tự động ghi lại hoạt động vào dB
export const auditLogMiddleware = async (req, res, next) => {
  // Override res.json để lấy dữ liệu response
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Bỏ qua các endpoint không cần log
    const skipPaths = ['/api/health', '/api/upload'];
    const shouldSkip = skipPaths.some((path) => req.path.startsWith(path));

    if (!shouldSkip && req.user) {
      const { module, resourceType } = getAuditLogInfo(req);
      const action = getAuditAction(req);

      // Chỉ log các action có ý nghĩa (không log READ)
      if (action !== 'READ' && res.statusCode < 400) {
        const logData = {
          action,
          module,
          description: generateDescription(req, action, module),
          userId: req.user?._id,
          userName: req.user?.fullName || req.user?.email,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          canteenId: req.user?.canteenId,
          resourceType,
          resourceId: req.params?.id || data?.data?._id,
          resourceName:
            data?.data?.name ||
            data?.data?.[Object.keys(data?.data || {})[0]]?.name ||
            'N/A',
          method: req.method,
          endpoint: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          statusCode: res.statusCode,
          newValues: req.body,
          oldValues: req.oldAuditValues || null,
        };

        // Ghi log không đợi (fire and forget)
        AuditLog.create(logData).catch((error) => {
          console.error('Lỗi khi ghi audit log:', error);
        });
      }
    }

    return originalJson(data);
  };

  next();
};

// Middleware: Ghi lại các lỗi
export const auditErrorLogging = async (err, req, res, next) => {
  if (req.user) {
    const { module } = getAuditLogInfo(req);

    const errorLog = {
      action: 'ERROR',
      module,
      description: `Lỗi: ${err.message}`,
      userId: req.user?._id,
      userName: req.user?.fullName || req.user?.email,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      canteenId: req.user?.canteenId,
      resourceType: 'Unknown',
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: err.statusCode || 500,
      errorMessage: err.message,
      errorStack: err.stack,
    };

    AuditLog.create(errorLog).catch((error) => {
      console.error('Lỗi khi ghi error log:', error);
    });
  }

  next(err);
};

// Hàm helper: Tạo mô tả hành động
const generateDescription = (req, action, module) => {
  const descriptions = {
    CREATE: `Tạo ${module} mới`,
    UPDATE: `Cập nhật ${module}`,
    DELETE: `Xóa ${module}`,
    LOGIN: `Đăng nhập vào hệ thống`,
    LOGOUT: `Đăng xuất khỏi hệ thống`,
    ERROR: `Lỗi trong ${module}`,
  };

  return descriptions[action] || `Thực hiện hành động ${action} trên ${module}`;
};

// Middleware factory: Tự động ghi audit log cho CREATE/UPDATE/DELETE
// Mapping tên tài nguyên sang tiếng Việt
const resourceTypeVietnamese = {
  Product: 'Sản phẩm',
  ProductCategory: 'Danh mục sản phẩm',
  Ingredient: 'Nguyên liệu',
  IngredientCategory: 'Danh mục nguyên liệu',
  Recipe: 'Công thức',
  Order: 'Đơn hàng',
  Menu: 'Thực đơn',
  MenuSchedule: 'Lịch thực đơn',
  User: 'Người dùng',
  Shift: 'Ca làm việc',
  Role: 'Quyền hạn',
  Permission: 'Quyền',
  Voucher: 'Phiếu giảm giá',
  Banner: 'Banner',
  Feedback: 'Phản hồi',
  Canteen: 'Căn tin',
  Attendance: 'Chấm công',
};

// Sử dụng: router.post('/', auditLogger('CREATE', 'Product', 'Product'), controller.create)
//         router.patch('/:id', auditLogger('UPDATE', 'Product', 'Product'), controller.update)
//         router.delete('/:id', auditLogger('DELETE', 'Product', 'Product'), controller.delete)
export const auditLogger = (action, resourceType, moduleName) => {
  return async (req, res, next) => {
    // Lưu data cũ từ URL (cho DELETE và UPDATE)
    if (action === 'UPDATE' || action === 'DELETE') {
      req.oldAuditValues = { ...req.body };
    }

    // Override res.json để ghi log
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Ghi log khi response thành công
      if (req.user && res.statusCode < 400) {
        // Lấy tên tiếng Việt của tài nguyên
        const resourceNameVi = resourceTypeVietnamese[moduleName] || moduleName;

        const logData = {
          action,
          module: resourceNameVi, // Lưu module bằng tiếng Việt
          description: `${action === 'CREATE' ? 'Tạo' : action === 'UPDATE' ? 'Cập nhật' : 'Xóa'} ${resourceNameVi}${data?.data?.name ? ': ' + data.data.name : ''}`,
          userId: req.user?._id,
          userName: req.user?.fullName || req.user?.name || req.user?.email,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          canteenId: req.user?.canteenId,
          resourceType: resourceNameVi, // Lưu resourceType bằng tiếng Việt
          resourceId: req.params?.id || data?.data?._id,
          resourceName: data?.data?.name || 'N/A',
          oldValues: req.oldAuditValues || null,
          newValues: action === 'DELETE' ? null : req.body || null,
          method: req.method,
          endpoint: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          statusCode: res.statusCode,
        };

        // Ghi log không đợi (fire and forget) - dùng hàm từ service
        auditLogService.logAuditAction(logData);
      }

      return originalJson(data);
    };

    next();
  };
};

// Middleware: Ghi lại login/logout
export const auditAuthEvent = (action) => {
  return async (req, res, next) => {
    // Ghi vào response chứ không phải request
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (req.user && res.statusCode === 200) {
        const mappedAction = action === 'LOGIN' ? 'CREATE' : 'DELETE';
        const logData = {
          action: mappedAction,
          module: 'Auth',
          description:
            action === 'LOGIN'
              ? 'Đăng nhập vào hệ thống'
              : 'Đăng xuất khỏi hệ thống',
          userId: req.user?._id,
          userName: req.user?.fullName || req.user?.email,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          canteenId: req.user?.canteenId,
          resourceType: 'Người dùng',
          method: req.method,
          endpoint: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          statusCode: res.statusCode,
        };

        AuditLog.create(logData).catch((error) => {
          console.error('Lỗi khi ghi auth log:', error);
        });
      }

      return originalJson(data);
    };

    next();
  };
};
