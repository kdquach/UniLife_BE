import express from "express";
import { protect, restrictTo } from "../../middlewares/auth.middleware.js";
import {
  getMySchedule,
} from "./staffShift.controller.js";

const router = express.Router();

router.use(protect);

router.get("/my", restrictTo("staff", "manager", "admin"), getMySchedule);

export default router;
