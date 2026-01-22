# 📝 Quick Start - Logging System

## What You Get

✅ **Colorful HTTP request logs** - See all API calls in real-time  
✅ **Request tracking** - Each request has unique ID (UUID)  
✅ **User context** - See who made the request (role + email)  
✅ **Response time** - Color-coded (green < 500ms, yellow < 1s, red > 1s)  
✅ **File logging** - All logs saved to `logs/` folder  
✅ **Error details** - Full stack trace with request context

---

## Console Output Example

```bash
# Development mode - Beautiful colored output
📍 NEW REQUEST [18:26:37 22/1/2026] GET /api/products 200 45.23ms [customer:john@example.com] - 5.3KB ::1
📍 NEW REQUEST [18:26:38 22/1/2026] POST /api/orders 201 123.45ms [customer:john@example.com] - 2.1KB ::1
📍 NEW REQUEST [18:26:39 22/1/2026] GET /api/users/invalid 404 12.34ms [admin:admin@uni.com] - 0.5KB ::1
📍 NEW REQUEST [18:26:40 22/1/2026] POST /api/auth/login 500 234.56ms [Guest] - 1.0KB ::1
```

**Colors:**
- 🟢 **Green (200-299)**: Success
- 🔵 **Cyan (300-399)**: Redirects  
- 🟡 **Yellow (400-499)**: Client errors
- 🔴 **Red (500-599)**: Server errors

---

## File Logs

Logs are automatically saved to:

- **`logs/error.log`** - Only errors (4xx, 5xx status codes)
- **`logs/combined.log`** - All requests and application logs

**Auto-rotation**: Files rotate at 5MB, keeping last 5 files.

---

## Configuration

### .env Settings

```bash
# Development = colorful logs, Production = JSON logs
NODE_ENV=development

# Optional: Enable detailed request/response body logging
ENABLE_REQUEST_LOGGING=false  # Default: false (recommended)
```

---

## Using Winston Logger in Code

```javascript
import logger from './config/logger.js';

// Log events
logger.info('User registered', { userId, email });
logger.warn('Low stock alert', { productId, quantity: 5 });
logger.error('Payment failed', { orderId, error });
```

**Helper functions:**

```javascript
import { logInfo, logError, logWarn } from './config/logger.js';

logInfo('Order placed', { orderId, total: 150.00 });
logError('Database error', error);
logWarn('API rate limit approaching', { remaining: 10 });
```

---

## Request ID Tracking

Every request gets a unique ID (UUID):

```javascript
// In any controller
export const getProduct = async (req, res, next) => {
  logger.info('Fetching product', {
    requestId: req.id,  // Auto-generated UUID
    productId: req.params.id,
  });
  
  // ...
};
```

View in response headers:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## Features

| Feature | Description |
|---------|-------------|
| **HTTP Logging** | Automatic via Morgan |
| **Request ID** | UUID tracking across logs |
| **User Context** | See role + email in logs |
| **Response Time** | Color-coded performance |
| **File Rotation** | Auto-delete old logs |
| **Error Tracking** | Full stack trace + context |

---

## Skip Logs

Health check endpoint is automatically excluded:

```javascript
// No logs for this endpoint
GET /api/health
```

---

## Full Documentation

See [LOGGING_SYSTEM.md](./LOGGING_SYSTEM.md) for:
- Complete configuration options
- Custom logger examples
- Production best practices
- Security considerations

---

**That's it! Your logs are now professional and easy to debug! 🎉**
