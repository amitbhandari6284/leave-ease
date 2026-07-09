const ALLOWED_NODE_ENVIRONMENTS = Object.freeze(["development", "test", "production"]);

const ALLOWED_COOKIE_SAME_SITE_VALUES = Object.freeze(["lax", "strict", "none"]);

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseInteger(name, fallback, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  const rawValue = process.env[name] === undefined ? String(fallback) : process.env[name].trim();

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < minimum || parsedValue > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }

  return parsedValue;
}

function parseBoolean(name, fallback = false) {
  const rawValue = process.env[name] === undefined ? String(fallback) : process.env[name].trim().toLowerCase();

  if (rawValue !== "true" && rawValue !== "false") {
    throw new Error(`${name} must be either true or false`);
  }

  return rawValue === "true";
}

function validateMongoUri(mongoUri) {
  const isValidMongoUri = mongoUri.startsWith("mongodb://") || mongoUri.startsWith("mongodb+srv://");

  if (!isValidMongoUri) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://");
  }
}

function validateTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format();
  } catch {
    throw new Error(`APP_TIME_ZONE is invalid: ${timeZone}`);
  }
}

export function validateEnvironment() {
  const nodeEnvironment = (process.env.NODE_ENV || "development").trim().toLowerCase();

  if (!ALLOWED_NODE_ENVIRONMENTS.includes(nodeEnvironment)) {
    throw new Error(`NODE_ENV must be one of: ${ALLOWED_NODE_ENVIRONMENTS.join(", ")}`);
  }

  const mongoUri = requireEnvironmentVariable("MONGODB_URI");

  validateMongoUri(mongoUri);

  const jwtSecret = requireEnvironmentVariable("JWT_SECRET");

  const jwtExpiresIn = requireEnvironmentVariable("JWT_EXPIRES_IN");

  const clientUrl = requireEnvironmentVariable("CLIENT_URL");

  let parsedClientUrl;

  try {
    parsedClientUrl = new URL(clientUrl);
  } catch {
    throw new Error("CLIENT_URL must be a valid URL");
  }

  if (!["http:", "https:"].includes(parsedClientUrl.protocol)) {
    throw new Error("CLIENT_URL must use HTTP or HTTPS");
  }

  if (nodeEnvironment === "production" && parsedClientUrl.protocol !== "https:") {
    throw new Error("CLIENT_URL must use HTTPS in production");
  }

  if (nodeEnvironment === "production" && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production");
  }

  const port = parseInteger("PORT", 5000, {
    minimum: 1,
    maximum: 65535,
  });

  const jwtCookieExpiresInDays = parseInteger("JWT_COOKIE_EXPIRES_IN_DAYS", 7, {
    minimum: 1,
    maximum: 365,
  });

  const trustProxyHops = parseInteger("TRUST_PROXY_HOPS", 0, {
    minimum: 0,
    maximum: 10,
  });

  const apiRateLimit = parseInteger("API_RATE_LIMIT", 300, {
    minimum: 1,
    maximum: 100000,
  });

  const loginRateLimit = parseInteger("LOGIN_RATE_LIMIT", 10, {
    minimum: 1,
    maximum: 10000,
  });

  const rateLimitDisabled = parseBoolean("RATE_LIMIT_DISABLED", false);

  const cookieSecure = parseBoolean("COOKIE_SECURE", nodeEnvironment === "production");

  const cookieSameSite = (process.env.COOKIE_SAME_SITE || "lax").trim().toLowerCase();

  if (!ALLOWED_COOKIE_SAME_SITE_VALUES.includes(cookieSameSite)) {
    throw new Error(`COOKIE_SAME_SITE must be one of: ${ALLOWED_COOKIE_SAME_SITE_VALUES.join(", ")}`);
  }

  if (cookieSameSite === "none" && !cookieSecure) {
    throw new Error("COOKIE_SECURE must be true when COOKIE_SAME_SITE is none");
  }

  if (nodeEnvironment === "production" && !cookieSecure) {
    throw new Error("COOKIE_SECURE must be true in production");
  }

  if (nodeEnvironment === "production" && rateLimitDisabled) {
    throw new Error("RATE_LIMIT_DISABLED cannot be true in production");
  }

  const appTimeZone = (process.env.APP_TIME_ZONE || "Asia/Kolkata").trim();

  validateTimeZone(appTimeZone);

  return Object.freeze({
    nodeEnvironment,
    mongoUri,
    jwtSecret,
    jwtExpiresIn,
    jwtCookieExpiresInDays,
    clientUrl,
    port,
    trustProxyHops,
    apiRateLimit,
    loginRateLimit,
    rateLimitDisabled,
    cookieSecure,
    cookieSameSite,
    appTimeZone,
  });
}
