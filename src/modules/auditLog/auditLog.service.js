import AuditLog from './auditLog.model.js';

// Lấy danh sách nhật ký hoạt động
export const getAllAuditLogs = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    action,
    resourceType,
    userId,
    canteenId,
    startDate,
    endDate,
  } = filters;

  const skip = (page - 1) * limit;
  const query = {};

  // Xây dựng query từ filters
  if (action) query.action = action;
  if (resourceType) query.resourceType = resourceType;
  if (userId) query.userId = userId;
  if (canteenId) query.canteenId = canteenId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Lấy chi tiết một nhật ký
export const getAuditLogById = async (id) => {
  const log = await AuditLog.findById(id).lean();
  if (!log) {
    throw new Error('Không tìm thấy nhật ký hoạt động');
  }
  return log;
};

// Tạo nhật ký hoạt động
export const createAuditLog = async (logData) => {
  const log = await AuditLog.create(logData);
  return log;
};

// Lấy nhật ký theo người dùng
export const getAuditLogsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20, days = 30 } = options;
  const skip = (page - 1) * limit;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [logs, total] = await Promise.all([
    AuditLog.find({
      userId,
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments({
      userId,
      createdAt: { $gte: startDate },
    }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Lấy nhật ký theo tài nguyên
export const getAuditLogsByResource = async (
  resourceType,
  resourceId,
  options = {}
) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find({
      resourceType,
      resourceId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments({
      resourceType,
      resourceId,
    }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Lấy thống kê hoạt động
export const getActivityStatistics = async (canteenId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = {
    createdAt: { $gte: startDate },
  };

  if (canteenId) query.canteenId = canteenId;

  const [totalActions, actionsByType, actionsByUser] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          userName: { $first: '$userName' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    totalActions,
    actionsByType,
    actionsByUser,
    period: {
      startDate,
      days,
    },
  };
};

// Xóa nhật ký cũ (hơn 90 ngày)
export const deleteOldAuditLogs = async (days = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await AuditLog.deleteMany({
    createdAt: { $lt: cutoffDate },
  });

  return {
    deletedCount: result.deletedCount,
    message: `Đã xóa ${result.deletedCount} nhật ký hoạt động`,
  };
};

// Xóa nhật ký theo điều kiện
export const deleteAuditLogsByFilter = async (filters = {}) => {
  const { userId, resourceType, resourceId, action } = filters;

  const query = {};
  if (userId) query.userId = userId;
  if (resourceType) query.resourceType = resourceType;
  if (resourceId) query.resourceId = resourceId;
  if (action) query.action = action;

  const result = await AuditLog.deleteMany(query);
  return {
    deletedCount: result.deletedCount,
    message: `Đã xóa ${result.deletedCount} nhật ký hoạt động`,
  };
};

// Lấy nhật ký lỗi
export const getErrorLogs = async (options = {}) => {
  const { page = 1, limit = 20, days = 7 } = options;
  const skip = (page - 1) * limit;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [logs, total] = await Promise.all([
    AuditLog.find({
      action: 'ERROR',
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments({
      action: 'ERROR',
      createdAt: { $gte: startDate },
    }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Hàm helper: Tự động ghi audit log cho CREATE/UPDATE/DELETE
export const logAuditAction = async (logData) => {
  // Lưu ý: tất cả dữ liệu cần được chuẩn bị sẵn từ controller
  try {
    const audit = await AuditLog.create({
      action: logData.action, // CREATE, UPDATE, DELETE
      module: logData.module,
      description: logData.description,
      userId: logData.userId,
      userName: logData.userName,
      userEmail: logData.userEmail,
      userRole: logData.userRole,
      canteenId: logData.canteenId,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId,
      resourceName: logData.resourceName,
      oldValues: logData.oldValues || null,
      newValues: logData.newValues || null,
      method: logData.method,
      endpoint: logData.endpoint,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      statusCode: logData.statusCode,
    });
    return audit;
  } catch (error) {
    console.error('Lỗi khi ghi audit log:', error);
    // Không throw error để không ảnh hưởng đến request chính
  }
};
