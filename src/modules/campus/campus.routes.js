import express from "express";
import * as campusController from "./campus.controller.js";

const router = express.Router();

// Lấy danh sách campus (public hoặc dùng cho dashboard)
router.get("/", campusController.getActiveCampuses);

export default router;
