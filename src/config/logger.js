import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Tell winston to use these colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaStr = "";

    if (Object.keys(meta).length > 0) {
      metaStr = "\n" + JSON.stringify(meta, null, 2);
    }

    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }),
);

// Define which transports to use
const transports = [
  // Console transport - always enabled
  new winston.transports.Console({
    format,
  }),

  // Error log file - only errors
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/error.log"),
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Combined log file - all logs
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/combined.log"),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
import fs from "fs";
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Wrapper functions for easier use
export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logError = (message, meta = {}) => {
  logger.error(message, meta);
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

export const logHttp = (message, meta = {}) => {
  logger.http(message, meta);
};

export default logger;
