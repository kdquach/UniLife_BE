import dotenv from 'dotenv';
dotenv.config();

export const momoConfig = {
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/momo/result',
    ipnUrl: process.env.MOMO_IPN_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    requestType: process.env.MOMO_REQUEST_TYPE || 'payWithMethod',
    autoCapture: process.env.MOMO_AUTO_CAPTURE ? process.env.MOMO_AUTO_CAPTURE === 'true' : true,
    lang: process.env.MOMO_LANG || 'vi',
    endpoint: process.env.PAY_URL || 'https://test-payment.momo.vn/v2/gateway/api/create'
};

export default momoConfig;
