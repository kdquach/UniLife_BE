import { verifyToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import User from "../modules/user/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import { isTokenBlacklisted } from "../modules/auth/auth.service.js";
import { UserRole, RolePermission } from "../modules/role/role.model.js";

/**
 * Protect middleware - Verify JWT token and attach user to request
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to access.", 401),
    );
  }

  // Check if token is blacklisted (logged out)
  if (isTokenBlacklisted(token)) {
    return next(
      new AppError(
        "This token has been invalidated. Please log in again.",
        401,
      ),
    );
  }

  // Verify token
  const decoded = verifyToken(token);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401),
    );
  }

  // Grant access to protected route
  req.user = currentUser;
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
        new AppError("You do not have permission to perform this action.", 403),
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
    const userRoles = await UserRole.find({ userId }).populate("roleId");

    if (!userRoles || userRoles.length === 0) {
      return next(new AppError("You do not have any assigned roles.", 403));
    }

    // Lấy tất cả permission của các role này
    const roleIds = userRoles.map((ur) => ur.roleId._id);
    const rolePermissions = await RolePermission.find({
      roleId: { $in: roleIds },
    }).populate("permissionId");
    console.log("🚀 ~ requirePermission ~ rolePermissions:", rolePermissions)

    // Lấy danh sách permission code
    const userPermissionCodes = rolePermissions.map(
      (rp) => rp.permissionId.code,
    );
    console.log("🚀 ~ requirePermission ~ userPermissionCodes:", userPermissionCodes)

    // Kiểm tra xem user có ít nhất 1 permission trong danh sách yêu cầu không
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissionCodes.includes(permission),
    );
    console.log("🚀 ~ requirePermission ~ hasPermission:", hasPermission)

    if (!hasPermission) {
      return next(
        new AppError(
          "You do not have the required permissions to perform this action.",
          403,
        ),
      );
    }

    next();
  });
};
