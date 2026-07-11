import mongoose from "mongoose";

import Holiday from "./holiday.model.js";
import { parseDateOnly } from "../../utils/dateOnly.js";
import { buildAuditChanges, createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { USER_ROLES } from "../../constants/roles.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";
import { AppError } from "../../utils/AppError.js";

const EDITABLE_HOLIDAY_FIELDS = ["name", "date", "type", "description"];

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

export async function createHoliday(req, res, next) {
  try {
    const { name, date, type = "PUBLIC", description = "" } = req.body;

    if (!name || !date) throw new AppError("Holiday name and date are required", 400, "MISSING_FIELDS");

    const parsedDate = parseDateOnly(date);

    if (!parsedDate) throw new AppError("Holiday date must be a valid date in YYYY-MM-DD format", 400, "INVALID_DATE_FORMAT");

    const holiday = await Holiday.create({
      name,
      date: parsedDate,
      type,
      description,
    });

    await runAuditTask("holiday-created", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.HOLIDAY_CREATED,
        entityType: AUDIT_ENTITY_TYPES.HOLIDAY,
        entityId: holiday._id,
        description: `Created holiday ${holiday.name}.`,
        changes: {
          name: {
            from: null,
            to: holiday.name,
          },
          date: {
            from: null,
            to: holiday.date.toISOString(),
          },
          type: {
            from: null,
            to: holiday.type,
          },
        },
        request: req,
      }),
    );

    return res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      holiday,
    });
  } catch (error) {
    // Duplicate-key (E11000) and ValidationError are normalized centrally
    // by errorHandler.js — no need to catch them here.
    next(error);
  }
}

export async function getHolidays(req, res, next) {
  try {
    const requestedYear = req.query.year;

    const year = requestedYear ? Number(requestedYear) : new Date().getUTCFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100)
      throw new AppError("Please provide a valid holiday year", 400, "INVALID_YEAR");

    const includeInactive = req.query.includeInactive === "true" && req.user.role === USER_ROLES.ADMIN;

    const startOfYear = new Date(Date.UTC(year, 0, 1));

    const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1));

    const filter = {
      date: {
        $gte: startOfYear,
        $lt: startOfNextYear,
      },
    };

    if (!includeInactive) {
      filter.isActive = true;
    }

    const holidays = await Holiday.find(filter).sort({
      date: 1,
    });

    return res.status(200).json({
      success: true,
      year,
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateHoliday(req, res, next) {
  try {
    const { holidayId } = req.params;

    if (!mongoose.isValidObjectId(holidayId)) throw new AppError("Invalid holiday ID", 400, "INVALID_IDENTIFIER");

    if (hasOwn(req.body, "isActive"))
      throw new AppError("isActive cannot be updated through this endpoint", 400, "RESTRICTED_FIELD_UPDATE");

    const providedFields = EDITABLE_HOLIDAY_FIELDS.filter((field) => hasOwn(req.body, field));

    if (providedFields.length === 0) throw new AppError("No editable holiday fields were provided", 400, "MISSING_UPDATE_DATA");

    const holiday = await Holiday.findById(holidayId);

    // Bug fix: null-check now happens before .toObject() is called,
    // instead of after (which crashed on a genuine 404).
    if (!holiday) throw new AppError("Holiday not found", 404, "HOLIDAY_NOT_FOUND");

    const auditBeforeHoliday = holiday.toObject();

    if (hasOwn(req.body, "date")) {
      const parsedDate = parseDateOnly(req.body.date);

      if (!parsedDate) throw new AppError("Holiday date must be a valid date in YYYY-MM-DD format", 400, "INVALID_DATE_FORMAT");

      holiday.date = parsedDate;
    }

    if (hasOwn(req.body, "name")) {
      holiday.name = req.body.name;
    }

    if (hasOwn(req.body, "type")) {
      holiday.type = req.body.type;
    }

    if (hasOwn(req.body, "description")) {
      holiday.description = req.body.description;
    }

    await holiday.save();

    const holidayChanges = buildAuditChanges(auditBeforeHoliday, holiday.toObject(), EDITABLE_HOLIDAY_FIELDS);

    await runAuditTask("holiday-updated", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.HOLIDAY_UPDATED,
        entityType: AUDIT_ENTITY_TYPES.HOLIDAY,
        entityId: holiday._id,
        description: `Updated holiday ${holiday.name}.`,
        changes: holidayChanges,
        request: req,
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      holiday,
    });
  } catch (error) {
    // Duplicate-key (E11000) and ValidationError are normalized centrally
    // by errorHandler.js — no need to catch them here.
    next(error);
  }
}

export async function updateHolidayStatus(req, res, next) {
  try {
    const { holidayId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(holidayId)) throw new AppError("Invalid holiday ID", 400, "INVALID_IDENTIFIER");

    if (typeof isActive !== "boolean") throw new AppError("isActive must be a boolean value", 400, "INVALID_BOOLEAN_VALUE");

    const holiday = await Holiday.findById(holidayId);

    if (!holiday) throw new AppError("Holiday not found", 404, "HOLIDAY_NOT_FOUND");

    if (holiday.isActive === isActive)
      throw new AppError(
        isActive ? "Holiday is already active" : "Holiday is already inactive",
        400,
        isActive ? "HOLIDAY_ALREADY_ACTIVE" : "HOLIDAY_ALREADY_INACTIVE",
      );

    holiday.isActive = isActive;

    await holiday.save();

    await runAuditTask("holiday-status-changed", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.HOLIDAY_STATUS_CHANGED,
        entityType: AUDIT_ENTITY_TYPES.HOLIDAY,
        entityId: holiday._id,
        description: isActive ? `Activated holiday ${holiday.name}.` : `Deactivated holiday ${holiday.name}.`,
        changes: {
          isActive: {
            from: !isActive,
            to: isActive,
          },
        },
        request: req,
      }),
    );

    return res.status(200).json({
      success: true,
      message: isActive ? "Holiday activated successfully" : "Holiday deactivated successfully",
      holiday,
    });
  } catch (error) {
    next(error);
  }
}
