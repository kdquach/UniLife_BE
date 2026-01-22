# 🎯 Logging System - UniLife Backend

Professional logging system với **Morgan** (HTTP requests) và **Winston** (Application logs).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Console Output](#console-output)
- [File Logging](#file-logging)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Log Levels](#log-levels)
- [Custom Logger](#custom-logger)
- [Production Best Practices](#production-best-practices)

---

## 🎨 Overview

Hệ thống logging được thiết kế với 2 tầng:

1. **Morgan (HTTP Logging)**: Logs tất cả HTTP requests/responses
2. **Winston (Application Logging)**: Logs application events, errors, debug info

---

## ✨ Features

### 🌈 Colored Console Output (Development)

```
[2024-01-15 14:30:45] GET /api/products 200 - 45.23 ms [student:john@example.com] [1.2 KB]
[2024-01-15 14:30:50] POST /api/orders 201 - 123.45 ms [customer:jane@example.com] [2.5 KB]
[2024-01-15 14:30:55] GET /api/users/invalid 404 - 12.34 ms [admin:admin@example.com] [0.5 KB]
[2024-01-15 14:31:00] POST /api/auth/login 500 - 234.56 ms [guest] [1.0 KB]
```

**Color Coding:**
- 🟢 **Green (2xx)**: Success responses
- 🔵 **Cyan (3xx)**: Redirects
- 🟡 **Yellow (4xx)**: Client errors
- 🔴 **Red (5xx)**: Server errors

**Response Time Colors:**
- 🟢 **Green (<500ms)**: Fast
- 🟡 **Yellow (500-1000ms)**: Moderate
- 🔴 **Red (>1000ms)**: Slow

### 📝 Request ID Tracking

Mỗi request được gán một UUID duy nhất để dễ dàng tracing:

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 📂 File Logging

Logs được lưu vào 2 files với rotation tự động:

1. **`logs/error.log`**: Chỉ errors (status 4xx, 5xx)
2. **`logs/combined.log`**: Tất cả logs

**File Rotation:**
- Max file size: 5MB
- Max files: 5 files (tự động xóa files cũ)
- Format: JSON (dễ parse cho log aggregation tools)

### 🎭 Environment-Specific Behavior

| Environment | Console Output | File Logging | Format |
|------------|----------------|--------------|---------|
| **Development** | ✅ Colorful, detailed | ✅ All logs | Human-readable |
| **Production** | ✅ JSON format | ✅ Errors only | JSON |
| **Test** | ❌ Silent | ❌ Disabled | N/A |

---

## 🖥️ Console Output

### Development Mode

```bash
# Colorful với đầy đủ thông tin
[2024-01-15 14:30:45] POST /api/auth/login 200 - 45.23 ms [guest] [1.2 KB]
[2024-01-15 14:30:50] GET /api/products?page=1&limit=10 200 - 23.45 ms [customer:john@example.com] [5.3 KB]
[2024-01-15 14:30:55] PUT /api/users/123 401 - 12.34 ms [guest] [0.5 KB]
[2024-01-15 14:31:00] DELETE /api/products/456 403 - 8.90 ms [staff:jane@example.com] [0.3 KB]
```

### Production Mode

```json
{
  "method": "POST",
  "url": "/api/auth/login",
  "status": 200,
  "responseTime": "45.23ms",
  "contentLength": "1.2KB",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1",
  "timestamp": "2024-01-15T14:30:45.123Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 📂 File Logging

### Error Log (`logs/error.log`)

```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2024-01-15T14:30:45.123Z",
  "stack": "Error: Connection timeout...",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "60d5ec49f1b2c72b8c8e4f1a",
  "method": "POST",
  "url": "/api/orders"
}
```

### Combined Log (`logs/combined.log`)

```json
{
  "level": "info",
  "message": "User logged in successfully",
  "timestamp": "2024-01-15T14:30:45.123Z",
  "userId": "60d5ec49f1b2c72b8c8e4f1a",
  "email": "john@example.com"
}
{
  "level": "http",
  "message": "POST /api/auth/login 200 45.23ms",
  "timestamp": "2024-01-15T14:30:45.123Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
{
  "level": "warn",
  "message": "Invalid token provided",
  "timestamp": "2024-01-15T14:30:50.123Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440001"
}
```

---

## ⚙️ Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Development: colorful console logs
NODE_ENV=development

# Enable detailed request/response logging to files
# true: Log request body, query, headers, response to winston files
# false: Only log HTTP status lines with morgan (default)
ENABLE_REQUEST_LOGGING=false
```

### Morgan Configuration (`src/config/morgan.js`)

```javascript
// Custom tokens
morgan.token('timestamp', () => new Date().toLocaleString());
morgan.token('user-info', (req) => {
  if (!req.user) return '[guest]';
  return `[${req.user.role}:${req.user.email}]`;
});
morgan.token('req-size', (req) => {
  return req.headers['content-length'] || '0';
});

// Skip functions
const skipHealthCheck = (req) => req.url === '/api/health';
const skipSuccessful = (req, res) => res.statusCode < 400;
```

### Winston Configuration (`src/config/logger.js`)

```javascript
// Log levels with colors
const levels = {
  error: 0,    // 🔴 Red
  warn: 1,     // 🟡 Yellow
  info: 2,     // 🟢 Green
  http: 3,     // 🟣 Magenta
  debug: 4,    // 🔵 Blue
};

// File transports
const transports = [
  new winston.transports.Console({ format: colorizedFormat }),
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: 'logs/combined.log' }),
];
```

---

## 💡 Usage Examples

### 1. Using Morgan (Automatic HTTP Logging)

Morgan tự động log mọi HTTP request. Không cần code thêm.

```javascript
// ✅ Automatically logged by Morgan
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, data: products });
});

// Console output:
// [2024-01-15 14:30:45] GET /api/products 200 - 45.23 ms [customer:john@example.com] [2.5 KB]
```

### 2. Using Winston Logger in Controllers

```javascript
import logger from '../config/logger.js';

export const createProduct = async (req, res, next) => {
  try {
    // Log info
    logger.info('Creating new product', {
      userId: req.user._id,
      productName: req.body.name,
    });

    const product = await Product.create(req.body);

    // Log success
    logger.info('Product created successfully', {
      productId: product._id,
      name: product.name,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // Log error
    logger.error('Failed to create product', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id,
      requestId: req.id,
    });
    
    next(error);
  }
};
```

### 3. Helper Functions

```javascript
import { logInfo, logError, logWarn, logDebug } from '../config/logger.js';

// Simple logging
logInfo('User logged in', { userId: user._id });
logError('Database error', error);
logWarn('Low stock alert', { productId, quantity: 5 });
logDebug('Cache hit', { key: 'products:all' });
```

### 4. Logging with Request Context

```javascript
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);

    // Log with request ID for tracing
    logger.info('User updated', {
      requestId: req.id, // Auto-generated UUID
      userId: req.user._id,
      targetUserId: req.params.id,
      changes: req.body,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Update failed', {
      requestId: req.id,
      error: error.message,
    });
    next(error);
  }
};
```

---

## 📊 Log Levels

Winston supports 5 log levels (from highest to lowest priority):

| Level | Priority | Usage | Color |
|-------|----------|-------|-------|
| **error** | 0 | Critical errors, crashes | 🔴 Red |
| **warn** | 1 | Warnings, potential issues | 🟡 Yellow |
| **info** | 2 | Important events, milestones | 🟢 Green |
| **http** | 3 | HTTP requests (Morgan) | 🟣 Magenta |
| **debug** | 4 | Debugging information | 🔵 Blue |

### When to Use Each Level

```javascript
// ❌ ERROR: System failures, critical bugs
logger.error('Database connection lost', { error: err });
logger.error('Payment processing failed', { orderId, userId });

// ⚠️ WARN: Potential problems, deprecated usage
logger.warn('API rate limit approaching', { remaining: 10 });
logger.warn('Using deprecated endpoint', { endpoint: '/api/v1/old' });

// ℹ️ INFO: Important business events
logger.info('User registered', { userId, email });
logger.info('Order placed', { orderId, total: 150.00 });

// 🌐 HTTP: Automatic HTTP request logs (handled by Morgan)
// No need to log manually - Morgan handles this

// 🐛 DEBUG: Detailed debugging (only in development)
logger.debug('Cache lookup', { key: 'products:all', hit: true });
logger.debug('Query performance', { duration: '45ms', collection: 'orders' });
```

---

## 🛠️ Custom Logger

Create custom loggers for specific modules:

```javascript
// src/utils/customLogger.js
import winston from 'winston';

export const paymentLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/payment.log' }),
  ],
});

export const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
  ],
});
```

Usage:

```javascript
import { paymentLogger, securityLogger } from '../utils/customLogger.js';

// Payment operations
paymentLogger.info('Payment processed', {
  orderId,
  amount,
  paymentMethod: 'credit_card',
});

// Security events
securityLogger.warn('Failed login attempt', {
  email,
  ip: req.ip,
  attempts: 3,
});
```

---

## 🚀 Production Best Practices

### 1. Disable Request Body Logging

```bash
# .env (production)
ENABLE_REQUEST_LOGGING=false  # Only log HTTP status, not body
```

### 2. Use Log Aggregation Services

Forward logs to services like:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog**
- **Loggly**
- **Splunk**

```javascript
// Add remote transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Http({
    host: 'logs.example.com',
    port: 8080,
    path: '/logs',
  }));
}
```

### 3. Rotate Logs Regularly

```javascript
// Adjust retention in logger.js
new winston.transports.File({
  filename: 'logs/combined.log',
  maxsize: 5242880, // 5MB
  maxFiles: 10,     // Keep 10 files (increased from 5)
});
```

### 4. Monitor Error Rates

Use services like **Sentry** for real-time error tracking:

```bash
npm install @sentry/node
```

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### 5. Sanitize Sensitive Data

Never log:
- ❌ Passwords
- ❌ Credit card numbers
- ❌ API keys
- ❌ JWT tokens

```javascript
// ❌ BAD
logger.info('User login', { email, password }); // Never log password!

// ✅ GOOD
logger.info('User login', { email }); // Only log non-sensitive data

// ✅ BETTER - Sanitize request body
const sanitizedBody = { ...req.body };
delete sanitizedBody.password;
logger.info('User registration', { body: sanitizedBody });
```

---

## 📝 Example Log Output

### Development Console

```bash
[2024-01-15 14:30:45] POST /api/auth/register 201 - 234.56 ms [guest] [2.5 KB]
[2024-01-15 14:30:50] POST /api/auth/login 200 - 123.45 ms [guest] [1.8 KB]
[2024-01-15 14:30:55] GET /api/products?page=1&limit=10 200 - 45.23 ms [customer:john@example.com] [8.2 KB]
[2024-01-15 14:31:00] POST /api/orders 201 - 567.89 ms [customer:john@example.com] [3.1 KB]
[2024-01-15 14:31:05] GET /api/orders/my-orders 200 - 89.12 ms [customer:john@example.com] [12.5 KB]
[2024-01-15 14:31:10] PUT /api/users/profile 200 - 234.56 ms [customer:john@example.com] [1.2 KB]
[2024-01-15 14:31:15] GET /api/notifications 200 - 34.56 ms [customer:john@example.com] [4.8 KB]
[2024-01-15 14:31:20] DELETE /api/cart/items/123 204 - 12.34 ms [customer:john@example.com] [0 B]
```

### Production JSON Logs

```json
{"level":"info","message":"Server started on port 5000","timestamp":"2024-01-15T14:30:00.000Z"}
{"level":"http","message":"POST /api/auth/login 200 123.45ms","requestId":"550e8400-e29b-41d4-a716-446655440000","timestamp":"2024-01-15T14:30:45.123Z"}
{"level":"info","message":"User logged in","userId":"60d5ec49f1b2c72b8c8e4f1a","email":"john@example.com","timestamp":"2024-01-15T14:30:45.456Z"}
{"level":"error","message":"Payment failed","orderId":"ORD-2024-001","error":"Insufficient balance","stack":"Error: Insufficient balance\n    at PaymentService.process...","timestamp":"2024-01-15T14:31:00.789Z"}
```

---

## 🎓 Summary

| Feature | Tool | Purpose |
|---------|------|---------|
| **HTTP Logging** | Morgan | Log all API requests/responses |
| **Application Logging** | Winston | Log events, errors, debug info |
| **Request Tracking** | UUID | Trace requests across logs |
| **File Logging** | Winston Transports | Persist logs for analysis |
| **Colors** | Chalk | Colorful console output |
| **Log Rotation** | Winston Rotation | Auto-delete old logs |

---

## 🔗 Related Documentation

- [Morgan Documentation](https://github.com/expressjs/morgan)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Chalk Documentation](https://github.com/chalk/chalk)

---

**Happy Logging! 🎉**
