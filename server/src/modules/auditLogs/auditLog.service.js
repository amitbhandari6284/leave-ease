import AuditLog from "./auditLog.model.js";

function getDocumentId(value) {
  if (!value) {
    return null;
  }

  if (value._id) {
    return value._id;
  }

  return value;
}

function getRequestIp(request) {
  if (!request) {
    return "";
  }

  const forwardedFor = request.headers?.["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim();
  }

  return request.ip || request.socket?.remoteAddress || "";
}

function getUserAgent(request) {
  if (!request) {
    return "";
  }

  return String(request.headers?.["user-agent"] || "").slice(0, 500);
}

export async function createAuditLog({
  actor = null,
  action,
  entityType,
  entityId = null,
  description,
  changes = null,
  metadata = {},
  success = true,
  request = null,
}) {
  return AuditLog.create({
    actor: getDocumentId(actor),

    actorRole: actor?.role || request?.user?.role || "SYSTEM",

    action,
    entityType,
    entityId: getDocumentId(entityId),
    description,
    changes,
    metadata,
    success,

    ipAddress: getRequestIp(request),
    userAgent: getUserAgent(request),
  });
}

/*
  Audit logging should not cause an already-successful business
  operation to fail.

  The error is logged to the server, while the original request
  can still return successfully.
*/
export async function runAuditTask(taskName, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`Audit task failed: ${taskName}`, error);

    return null;
  }
}

function normalizeAuditValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeAuditValue);
  }

  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }

  if (typeof value === "object" && value.constructor?.name === "ObjectId") {
    return value.toString();
  }

  return value;
}

export function buildAuditChanges(before, after, fields) {
  const changes = {};

  for (const field of fields) {
    const previousValue = normalizeAuditValue(before?.[field]);

    const nextValue = normalizeAuditValue(after?.[field]);

    if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
      changes[field] = {
        from: previousValue,
        to: nextValue,
      };
    }
  }

  return changes;
}
