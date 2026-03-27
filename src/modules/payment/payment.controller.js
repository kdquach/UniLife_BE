import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import * as momoService from "./payment.service.js";
import crypto from "crypto";
import { cancelUnpaidOrderForPaymentFailure } from "../order/order.service.js";




export const createMomoPayment = catchAsync(async (req, res, next) => {
    const { orderId, amount } = req.body || {};

    if (!orderId) {
        return next(new AppError("orderId is required", 400));
    }

    if (!amount || Number(amount) <= 0) {
        return next(new AppError("amount must be greater than 0", 400));
    }

    const momoRes = await momoService.createMomoPaymentRequest({
        orderId: String(orderId),
        amount: String(amount),
        orderInfo: `Thanh toán đơn hàng ${orderId}`,
    });

    return res.status(200).json({
        message: "Create MoMo payment success",
        result: momoRes,
    });
});
export const getMomoPaymentResult = async (req, res, next) => {
    const query = req.query || {};
    const {
        partnerCode = '',
        orderId,
        requestId = '',
        amount: rawAmount = '',
        orderInfo = '',
        orderType = '',
        transId = '',
        resultCode: rawResultCode = '',
        message = '',
        payType = '',
        responseTime = '',
        extraData = '',
        signature,
    } = query;

    const amount = String(rawAmount ?? '');
    const resultCode = String(rawResultCode ?? '');

    if (!orderId || !signature) {
        return res.status(400).json({ message: 'Missing params' });
    }

    // 1️ Tìm order
    const order = await momoService.getMomoPaymentResult(orderId)
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // 2️ Verify signature (bắt buộc)
    const rawSignature =
        `accessKey=${process.env.MOMO_ACCESS_KEY}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&message=${message}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&orderType=${orderType}` +
        `&partnerCode=${partnerCode}` +
        `&payType=${payType}` +
        `&requestId=${requestId}` +
        `&responseTime=${responseTime}` +
        `&resultCode=${resultCode}` +
        `&transId=${transId}`;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(400).json({ message: 'Invalid signature' });
    }

    // 3️ Update order state based on payment result
    const paymentStatusForRedirect = Number(resultCode) === 0 ? 'completed' : 'failed';

    if (paymentStatusForRedirect === 'completed') {
        order.payment.status = 'completed';
        await order.save();
    } else {
        // Payment failed/cancelled -> mark failed and auto-cancel (hard-delete) the unpaid order
        order.payment.status = 'failed';
        await order.save();
        try {
            await cancelUnpaidOrderForPaymentFailure(orderId, {
                reason: `MoMo payment failed/cancelled (resultCode=${resultCode})`,
            });
        } catch (e) {
            console.error('Auto-cancel unpaid MoMo order failed:', e?.message || e);
        }
    }
    return res.redirect(
        `http://localhost:5173/menu` +
        `?orderId=${orderId}&status=${paymentStatusForRedirect}&amount=${amount}`
    );
};

export default {
    createMomoPayment,
    getMomoPaymentResult
};
