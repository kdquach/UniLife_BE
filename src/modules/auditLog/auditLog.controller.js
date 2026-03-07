import * as auditLogService from './auditLog.service.js';

// Lấy danh sách nhật ký hoạt động
export const getAllAuditLogs = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      action,
      resourceType,
      userId,
      canteenId,
      startDate,
      endDate,
    } = req.query;

    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    };

    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (userId) filters.userId = userId;
    if (canteenId) filters.canteenId = canteenId || req.user?.canteenId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await auditLogService.getAllAuditLogs(filters);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết một nhật ký
export const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await auditLogService.getAuditLogById(id);

    res.status(200).json({
      status: 'success',
      data: { auditLog: log },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy nhật ký theo người dùng
export const getAuditLogsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page, limit, days } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      days: parseInt(days) || 30,
    };

    const result = await auditLogService.getAuditLogsByUser(userId, options);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy nhật ký theo tài nguyên
export const getAuditLogsByResource = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { page, limit } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    };

    const result = await auditLogService.getAuditLogsByResource(
      resourceType,
      resourceId,
      options
    );

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê hoạt động
export const getActivityStatistics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const canteenId = req.user?.canteenId;

    const statistics = await auditLogService.getActivityStatistics(
      canteenId,
      parseInt(days) || 30
    );

    res.status(200).json({
      status: 'success',
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy nhật ký lỗi
export const getErrorLogs = async (req, res, next) => {
  try {
    const { page, limit, days } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      days: parseInt(days) || 7,
    };

    const result = await auditLogService.getErrorLogs(options);

    res.status(200).json({
      status: 'success',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Xóa nhật ký cũ
export const deleteOldAuditLogs = async (req, res, next) => {
  try {
    const { days } = req.query;

    const result = await auditLogService.deleteOldAuditLogs(
      parseInt(days) || 90
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    next(error);
  }
};
