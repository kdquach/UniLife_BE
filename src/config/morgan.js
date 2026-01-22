import morgan from "morgan";
import chalk from "chalk";

/**
 * Custom Morgan Token Definitions
 */

// Custom token for colored status code
morgan.token("status-colored", (req, res) => {
  const status = res.statusCode;
  let color;

  if (status >= 500) {
    color = chalk.red.bold; // Server errors - red
  } else if (status >= 400) {
    color = chalk.yellow.bold; // Client errors - yellow
  } else if (status >= 300) {
    color = chalk.cyan.bold; // Redirects - cyan
  } else if (status >= 200) {
    color = chalk.green.bold; // Success - green
  } else {
    color = chalk.white; // Other - white
  }

  return color(status);
});

// Custom token for colored method
morgan.token("method-colored", (req) => {
  const method = req.method;
  const colors = {
    GET: chalk.blue.bold,
    POST: chalk.green.bold,
    PUT: chalk.yellow.bold,
    PATCH: chalk.yellow.bold,
    DELETE: chalk.red.bold,
    OPTIONS: chalk.gray.bold,
  };

  return (colors[method] || chalk.white)(method);
});

// Custom token for response time with color
morgan.token("response-time-colored", (req, res) => {
  const time = morgan["response-time"](req, res);
  const ms = parseFloat(time);

  let color;
  if (ms >= 1000) {
    color = chalk.red.bold; // Slow - red
  } else if (ms >= 500) {
    color = chalk.yellow.bold; // Medium - yellow
  } else {
    color = chalk.green; // Fast - green
  }

  return color(`${time}ms`);
});

// Custom token for timestamp
morgan.token("timestamp", () => {
  const now = new Date();
  return chalk.gray(
    `[${now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}]`,
  );
});

// Custom token for user info (if authenticated)
morgan.token("user-info", (req) => {
  if (req.user) {
    return chalk.magenta(`[${req.user.role}:${req.user.email}]`);
  }
  return chalk.gray("[Guest]");
});

// Custom token for request size
morgan.token("req-size", (req) => {
  const size = req.headers["content-length"];
  if (size) {
    return chalk.cyan(`${(parseInt(size) / 1024).toFixed(2)}KB`);
  }
  return chalk.gray("0KB");
});

/**
 * Morgan Format Configurations
 */

// Development format - detailed and colorful
export const developmentFormat = [
  chalk.bold("\n📍 NEW REQUEST"),
  ":timestamp",
  ":method-colored",
  chalk.white.bold(":url"),
  ":status-colored",
  ":response-time-colored",
  ":user-info",
  chalk.gray("- :req-size"),
  chalk.gray(":remote-addr"),
].join(" ");

// Production format - JSON for log aggregation
export const productionFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Compact format - less verbose
export const compactFormat = [
  ":timestamp",
  ":method-colored",
  chalk.white(":url"),
  ":status-colored",
  ":response-time-colored",
].join(" ");

/**
 * Morgan Skip Function
 * Skip logging for specific routes or conditions
 */
export const skipHealthCheck = (req, res) => {
  // Skip health check endpoint
  return req.url === "/api/health";
};

export const skipSuccessful = (req, res) => {
  // Only log errors in production
  return res.statusCode < 400;
};

/**
 * Get Morgan Middleware based on environment
 */
export const getMorganMiddleware = (env = "development") => {
  switch (env) {
    case "production":
      return morgan(productionFormat, {
        skip: skipHealthCheck,
      });

    case "test":
      return morgan("none"); // No logging in tests

    case "development":
    default:
      return morgan(developmentFormat, {
        skip: skipHealthCheck,
      });
  }
};

/**
 * Morgan Stream for Winston Integration
 */
export const morganStream = {
  write: (message) => {
    // Remove newline character
    const log = message.trim();
    if (log) {
      console.log(log);
    }
  },
};

export default getMorganMiddleware;
