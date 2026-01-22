import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger.js";

/**
 * Request ID Middleware
 * Adds unique ID to each request for tracking
 */
export const requestId = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader("X-Request-ID", req.id);
  next();
};

/**
 * Request Logger Middleware
 * Logs incoming requests with detailed information
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.http("Incoming Request", {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
    body: req.method !== "GET" ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    user: req.user
      ? {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
        }
      : undefined,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? "warn" : "http";

    logger[level]("Outgoing Response", {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
    });

    return res.send(data);
  };

  next();
};

/**
 * Error Logger Middleware
 * Logs errors with stack trace
 */
export const errorLogger = (err, req, res, next) => {
  logger.error("Error occurred", {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      status: err.statusCode || 500,
    },
    user: req.user
      ? {
          id: req.user._id,
          email: req.user.email,
        }
      : undefined,
  });

  next(err);
};

export default {
  requestId,
  requestLogger,
  errorLogger,
};
