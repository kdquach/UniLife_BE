import { verifyToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import User from '../modules/user/user.model.js';
import catchAsync from '../utils/catchAsync.js';
import { isTokenBlacklisted } from '../modules/auth/auth.service.js';
import { UserRole, RolePermission } from '../modules/role/role.model.js';

/**
 * Protect middleware - Verify JWT token and attach user to request
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to access.', 401)
    );
  }

  // Check if token is blacklisted (logged out)
  if (isTokenBlacklisted(token)) {
    return next(
      new AppError('This token has been invalidated. Please log in again.', 401)
    );
  }

  // Verify token
  const decoded = verifyToken(token);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  if (currentUser.status === 'inactive') {
    return next(new AppError('Tài khoản đã bị vô hiệu hóa', 403));
  }

  if (currentUser.status === 'banned') {
    return next(new AppError('Tài khoản đã bị khóa', 403));
  }

  if (currentUser.status === 'pending') {
    return next(new AppError('Tài khoản đang chờ kích hoạt', 403));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

/**
 * Optional Protect middleware - Attach user if token exists, but don't fail if missing
 * Dùng cho public routes muốn biết user có đăng nhập không
 */
export const optionalProtect = catchAsync(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Nếu không có token, vẫn cho qua (public route)
  if (!token) {
    return next();
  }

  try {
    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.status === 'active') {
      req.user = currentUser;
    }
  } catch (error) {
    // Nếu token invalid, vẫn cho qua nhưng không gắn user
  }

  next();
});

/**
 * Restrict middleware - Check user role
 * @param  {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Bạn không có quyền thực hiện thao tác này.', 403)
      );
    }
    next();
  };
};

/**
 * Middleware kiểm tra quyền của người dùng dựa trên Permission
 * @param  {...string} requiredPermissions - Danh sách mã permission cần thiết
 * @returns {Function} Middleware function
 */
export const requirePermission = (...requiredPermissions) => {
  return catchAsync(async (req, res, next) => {
    const userId = req.user._id;

    // Lấy tất cả role của user
    const userRoles = await UserRole.find({ userId }).populate('roleId');

    if (!userRoles || userRoles.length === 0) {
      return next(
        new AppError('Bạn chưa được gán vai trò nên không có quyền truy cập.', 403)
      );
    }

    // Lấy tất cả permission của các role này
    const roleIds = userRoles.map((ur) => ur.roleId._id);
    const rolePermissions = await RolePermission.find({
      roleId: { $in: roleIds },
    }).populate('permissionId');

    // Lấy danh sách permission code
    const userPermissionCodes = rolePermissions.map(
      (rp) => rp.permissionId.code
    );

    // Kiểm tra xem user có ít nhất 1 permission trong danh sách yêu cầu không
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissionCodes.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new AppError(
          'Bạn không có quyền để thực hiện thao tác này.',
          403
        )
      );
    }

    next();
  });
};
