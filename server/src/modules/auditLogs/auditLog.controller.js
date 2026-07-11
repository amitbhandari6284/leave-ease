import mongoose from "mongoose";

import AuditLog from "./auditLog.model.js";

import { AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES } from "../../constants/audit.js";

import { parseDateOnly } from "../../utils/dateOnly.js";
import { AppError } from "../../utils/AppError.js";

export async function getAuditLogs(req, res, next) {
  try {
    const { actor, action, entityType, entityId, success, startDate, endDate, page = "1", limit = "20" } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1)
      throw new AppError("Page must be a positive integer", 400, "INVALID_PAGINATION_PAGE");

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)
      throw new AppError("Limit must be between 1 and 100", 400, "INVALID_PAGINATION_LIMIT");

    const filter = {};

    if (actor) {
      if (!mongoose.isValidObjectId(actor)) throw new AppError("Invalid actor user ID", 400, "INVALID_IDENTIFIER");

      filter.actor = actor;
    }

    let normalizedAction = null;

    if (action) {
      normalizedAction = String(action).trim().toUpperCase();

      if (!AUDIT_ACTION_VALUES.includes(normalizedAction))
        throw new AppError(`Action must be one of: ${AUDIT_ACTION_VALUES.join(", ")}`, 400, "INVALID_ACTION_FILTER");

      filter.action = normalizedAction;
    }

    let normalizedEntityType = null;

    if (entityType) {
      normalizedEntityType = String(entityType).trim().toUpperCase();

      if (!AUDIT_ENTITY_TYPE_VALUES.includes(normalizedEntityType))
        throw new AppError(
          `Entity type must be one of: ${AUDIT_ENTITY_TYPE_VALUES.join(", ")}`,
          400,
          "INVALID_ENTITY_TYPE_FILTER",
        );

      filter.entityType = normalizedEntityType;
    }

    if (entityId) {
      if (!mongoose.isValidObjectId(entityId)) throw new AppError("Invalid entity ID", 400, "INVALID_IDENTIFIER");

      filter.entityId = entityId;
    }

    if (success !== undefined) {
      if (success !== "true" && success !== "false")
        throw new AppError("success must be true or false", 400, "INVALID_BOOLEAN_VALUE");

      filter.success = success === "true";
    }

    if (startDate || endDate) {
      filter.createdAt = {};
    }

    if (startDate) {
      const parsedStartDate = parseDateOnly(startDate);

      if (!parsedStartDate) throw new AppError("startDate must use the YYYY-MM-DD format", 400, "INVALID_DATE_FORMAT");

      filter.createdAt.$gte = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate = parseDateOnly(endDate);

      if (!parsedEndDate) throw new AppError("endDate must use the YYYY-MM-DD format", 400, "INVALID_DATE_FORMAT");

      /*
        Use the start of the following date so the provided
        end date is inclusive.
      */
      const endDateExclusive = new Date(parsedEndDate);

      endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);

      filter.createdAt.$lt = endDateExclusive;
    }

    if (filter.createdAt?.$gte && filter.createdAt?.$lt && filter.createdAt.$lt <= filter.createdAt.$gte)
      throw new AppError("endDate cannot be earlier than startDate", 400, "INVALID_DATE_RANGE");

    const skip = (parsedPage - 1) * parsedLimit;

    const [auditLogs, totalAuditLogs] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", ["name", "email", "employeeId", "role", "designation"].join(" "))
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit),

      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalAuditLogs / parsedLimit);

    return res.status(200).json({
      success: true,

      filters: {
        actor: actor || null,
        action: normalizedAction,
        entityType: normalizedEntityType,
        entityId: entityId || null,
        success: success === undefined ? null : success === "true",
        startDate: startDate || null,
        endDate: endDate || null,
      },

      count: auditLogs.length,
      auditLogs,

      pagination: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalAuditLogs,
        totalPages,
        hasPreviousPage: parsedPage > 1,
        hasNextPage: parsedPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}
