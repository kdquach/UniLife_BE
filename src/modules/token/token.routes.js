import express from "express";
import * as tokenController from "./token.controller.js";

const router = express.Router();

router.post("/otp/send", tokenController.createOTP);
router.post("/otp/verify", tokenController.verifyOTP);
router.post("/otp/resend", tokenController.resendOTP);

export default router;
