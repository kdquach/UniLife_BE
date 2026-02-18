import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import * as momoService from "./payment.service.js";
import crypto from "crypto";




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
    const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData = '',
        signature,
    } = req.query;
    console.log("🚀 ~ getMomoPaymentResult ~ resultCode:", resultCode)

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

    // 3️ Nếu thanh toán thành công
    if (Number(resultCode) === 0) {
        order.payment.status = 'completed';
        await order.save();
    } else {
        order.payment.status = 'failed';
        await order.save();
    }
    return res.redirect(
        `http://localhost:5173/menu` +
        `?orderId=${orderId}&status=${order.payment.status}&amount=${amount}`
    );
};

export default {
    createMomoPayment,
    getMomoPaymentResult
};
