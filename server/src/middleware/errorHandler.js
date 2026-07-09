/*
  Each matcher pairs a `test` (does this error match?) with a `build`
  (how to shape the response). Add new error types by appending here —
  no need to touch normalizeError itself.
*/
const errorMatchers = [
  {
    // Explicit application errors (thrown via AppError, etc.)
    test: (error) => error.isOperational,
    build: (error) => ({
      statusCode: error.statusCode || 500,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred",
    }),
  },
  {
    // Invalid MongoDB ObjectId
    test: (error) => error.name === "CastError",
    build: (error) => ({
      statusCode: 400,
      code: "INVALID_IDENTIFIER",
      message: `Invalid ${error.path || "identifier"}`,
    }),
  },
  {
    // Mongoose schema validation
    test: (error) => error.name === "ValidationError",
    build: (error) => {
      const validationMessages = Object.values(error.errors || {})
        .map((validationError) => validationError.message)
        .filter(Boolean);

      return {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: validationMessages.join(". ") || "The submitted data is invalid",
      };
    },
  },
  {
    // MongoDB duplicate-key error
    test: (error) => error.code === 11000,
    build: (error) => {
      const duplicateField = Object.keys(error.keyValue || {})[0] || "field";

      return {
        statusCode: 409,
        code: "DUPLICATE_VALUE",
        message: `${duplicateField} already exists`,
      };
    },
  },
  {
    // Invalid JSON request body
    test: (error) => error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, "body"),
    build: () => ({
      statusCode: 400,
      code: "INVALID_JSON",
      message: "The request body contains invalid JSON",
    }),
  },
  {
    // Request body exceeded the configured parser limit
    test: (error) => error.type === "entity.too.large",
    build: () => ({
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "The request body exceeds the allowed size",
    }),
  },
  {
    // JWT verification errors
    test: (error) => error.name === "JsonWebTokenError",
    build: () => ({
      statusCode: 401,
      code: "INVALID_TOKEN",
      message: "The authentication token is invalid",
    }),
  },
  {
    test: (error) => error.name === "TokenExpiredError",
    build: () => ({
      statusCode: 401,
      code: "TOKEN_EXPIRED",
      message: "The authentication token has expired",
    }),
  },
];

function normalizeError(error) {
  const matcher = errorMatchers.find(({ test }) => test(error));

  if (matcher) {
    return { ...matcher.build(error), isOperational: true };
  }

  /*
    Fallback for unknown programming or infrastructure errors.
  */
  return {
    statusCode: error.statusCode || error.status || 500,
    code: "INTERNAL_SERVER_ERROR",
    message: error.message || "An unexpected error occurred",
    isOperational: false,
  };
}

// process.env.NODE_ENV doesn't change during the process lifetime,
// so compute this once instead of on every request.
const isProduction = process.env.NODE_ENV === "production";

export function errorHandler(error, req, res, next) {
  const normalizedError = normalizeError(error);

  /*
    Always record unexpected server-side errors.
    Operational 4xx errors do not require full stack logging.
  */
  if (!normalizedError.isOperational || normalizedError.statusCode >= 500) {
    console.error({
      message: error.message,
      stack: error.stack,
      method: req.method,
      path: req.originalUrl,
      requestId: req.requestId || null,
    });
  }

  const publicMessage =
    isProduction && !normalizedError.isOperational ? "An unexpected server error occurred" : normalizedError.message;

  return res.status(normalizedError.statusCode).json({
    success: false,
    code: normalizedError.code,
    message: publicMessage,

    ...(!isProduction && {
      stack: error.stack,
    }),
  });
}
