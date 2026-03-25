import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware chung xử lý validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * Rules cho GET /api/users/system — View System Users
 */
export const getSystemUsersRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be 1-100"),
  query("status")
    .optional()
    .isIn(["active", "inactive", "banned", "pending"])
    .withMessage("Invalid status filter"),
  query("sortBy")
    .optional()
    .isIn(["email", "fullName", "createdAt", "status", "role"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Search query too long (max 100 characters)"),
  validate,
];

/**
 * Rules cho POST /api/users/system — Create System User
 */
export const createSystemUserRules = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be 2-100 characters"),
  body("role")
    .isIn(["admin", "canteen_owner", "manager", "staff"])
    .withMessage("Invalid role"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Please provide a valid phone number"),
  body("canteenId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid canteen ID format"),
  body("campusId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid campus ID format"),
  validate,
];

/**
 * Rules cho PATCH /api/users/system/:userId — Update System User
 */
export const updateSystemUserRules = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be 2-100 characters"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Please provide a valid phone number"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  validate,
];

/**
 * Rules cho PATCH /disable, /reenable — Disable/Re-enable System User
 */
export const statusChangeRules = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),
  body("reason")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Reason is required (5-500 characters)"),
  validate,
];

/**
 * Rules cho PATCH /role — Assign Role
 */
export const assignRoleRules = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),
  body("role")
    .isIn(["admin", "canteen_owner", "manager", "staff"])
    .withMessage("Invalid role"),
  validate,
];

/**
 * Rules cho DELETE /role — Remove/Downgrade Role
 */
export const removeRoleRules = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),
  body("downgradeToRole")
    .optional()
    .isIn(["admin", "canteen_owner", "manager", "staff", "customer"])
    .withMessage("Invalid target role"),
  body("reason")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Reason for role removal is required (5-500 characters)"),
  validate,
];
