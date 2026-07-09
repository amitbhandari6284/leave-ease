import { rateLimit } from "express-rate-limit";

function isRateLimitDisabled() {
  return process.env.RATE_LIMIT_DISABLED === "true";
}

function parseLimit(name, fallback) {
  const parsedValue = Number(process.env[name] || fallback);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function createRateLimitHandler(message) {
  return function rateLimitHandler(req, res) {
    return res.status(429).json({
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message,
    });
  };
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: parseLimit("API_RATE_LIMIT", 300),

  standardHeaders: "draft-8",
  legacyHeaders: false,

  skip: isRateLimitDisabled,

  handler: createRateLimitHandler("Too many requests. Please try again later."),
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: parseLimit("LOGIN_RATE_LIMIT", 10),

  standardHeaders: "draft-8",
  legacyHeaders: false,

  /*
    Successful logins are removed from the counter.
    Repeated failed attempts remain counted.
  */
  skipSuccessfulRequests: true,

  skip: isRateLimitDisabled,

  handler: createRateLimitHandler("Too many login attempts. Please try again later."),
});
