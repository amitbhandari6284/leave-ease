import crypto from "node:crypto";

export function attachRequestId(req, res, next) {
  const suppliedRequestId = req.headers["x-request-id"];

  req.requestId =
    typeof suppliedRequestId === "string" && suppliedRequestId.trim()
      ? suppliedRequestId.trim().slice(0, 100)
      : crypto.randomUUID();

  res.setHeader("X-Request-ID", req.requestId);

  next();
}
