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

export const listShiftChangeRequestsRules = [
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "expired"])
    .withMessage("status filter không hợp lệ"),
  validate,
];

export const createShiftChangeRequestRules = [
  body("staffShiftId")
    .isMongoId()
    .withMessage("staffShiftId không hợp lệ"),
  body("reason")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Lý do phải từ 5-500 ký tự"),
  validate,
];

export const reviewShiftChangeRequestRules = [
  param("id")
    .isMongoId()
    .withMessage("id yêu cầu không hợp lệ"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Trạng thái xử lý chỉ hỗ trợ approved hoặc rejected"),
  validate,
];
