import { verifyToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import User from "../modules/user/user.model.js";
import catchAsync from "../utils/catchAsync.js";

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
