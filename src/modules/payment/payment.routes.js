

import express from "express";
import { createMomoPayment, getMomoPaymentResult } from "./payment.controller.js";

const router = express.Router();


router.post('/create', createMomoPayment)

router.get('/result', getMomoPaymentResult)

export default router;

