# MoMo Payment Integration

## Overview

This module integrates MoMo AIO v2 payment creation endpoint. It separates HTTP layer (controller) from business logic (service) and keeps credentials in environment variables.

## Module Structure

- src/modules/payment/
  - payment.routes.js — Express routes for payment APIs
  - payment.controller.js — Validates input, generates IDs, returns HTTP responses
  - payment.service.js — Calls MoMo API via HTTPS, handles signing
  - payment.config.js — Reads credentials and endpoints from environment

## Environment Variables

Set these in your `.env`:

- MOMO_ACCESS_KEY
- MOMO_SECRET_KEY
- MOMO_PARTNER_CODE (e.g., MOMO)
- MOMO_REDIRECT_URL
- MOMO_IPN_URL
- MOMO_REQUEST_TYPE (default: payWithMethod)
- MOMO_AUTO_CAPTURE (true/false, default: true)
- MOMO_LANG (default: vi)
- MOMO_HOSTNAME (default: test-payment.momo.vn)
- MOMO_CREATE_PATH (default: /v2/gateway/api/create)

## API

POST /api/payment/create

Body:

```json
{
  "amount": 50000,
  "orderInfo": "Order #12345",
  "extraData": ""
}
```

Response (from MoMo):

```json
{
  "message": "Create payment request successfully",
  "data": { "payUrl": "...", "deeplink": "...", "resultCode": 0, ... }
}
```

## Notes

- Do not hardcode keys in source control.
- For production, switch hostname to MoMo production endpoint and use real credentials.
- All imports use ESM with explicit `.js` extension.
