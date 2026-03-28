import { body, param, query, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  return next();
};

export const getManagerStaffListRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("limit phải trong khoảng 1-200"),
  query("status")
    .optional()
    .isIn(["active", "inactive", "pending", "banned"])
    .withMessage("status filter không hợp lệ"),
  query("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("gender filter không hợp lệ"),
  query("emailVerified")
    .optional()
    .isIn(["true", "false", true, false])
    .withMessage("emailVerified phải là true hoặc false"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "fullName", "email", "status"])
    .withMessage("sortBy không hợp lệ"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder phải là asc hoặc desc"),
  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("search không được vượt quá 100 ký tự"),
  validate,
];

export const getManagerStaffDetailRules = [
  param("id")
    .isMongoId()
    .withMessage("id nhân viên không hợp lệ"),
  validate,
];

export const createManagerStaffRules = [
  body("email")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),
  body("phone")
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên phải từ 2-100 ký tự"),
  body().custom((value) => {
    const fullName = String(value?.fullName || "").trim();
    const name = String(value?.name || "").trim();
    if (!fullName && !name) {
      throw new Error("Vui lòng cung cấp fullName hoặc name");
    }
    return true;
  }),
  validate,
];

export const updateManagerStaffRules = [
  param("id")
    .isMongoId()
    .withMessage("id nhân viên không hợp lệ"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên phải từ 2-100 ký tự"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Trạng thái chỉ hỗ trợ active hoặc inactive"),
  body().custom((value) => {
    const allowedFields = ["phone", "fullName", "name", "gender", "status"];
    const hasAtLeastOneField = allowedFields.some((field) => value?.[field] !== undefined);

    if (!hasAtLeastOneField) {
      throw new Error("Không có dữ liệu hợp lệ để cập nhật");
    }

    return true;
  }),
  validate,
];
