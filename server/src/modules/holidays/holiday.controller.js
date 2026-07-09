import mongoose from "mongoose";

import Holiday from "./holiday.model.js";
import { parseDateOnly } from "../../utils/dateOnly.js";
import { buildAuditChanges, createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { USER_ROLES } from "../../constants/roles.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";

const EDITABLE_HOLIDAY_FIELDS = ["name", "date", "type", "description"];

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

export async function createHoliday(req, res, next) {
  try {
    const { name, date, type = "PUBLIC", description = "" } = req.body;

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: "Holiday name and date are required",
      });
    }

    const parsedDate = parseDateOnly(date);

    if (!parsedDate) {
      return res.status(400).json({
        success: false,
        message: "Holiday date must be a valid date in YYYY-MM-DD format",
      });
    }

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
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A holiday already exists on the selected date",
      });
    }

    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors).map((validationError) => validationError.message);

      return res.status(400).json({
        success: false,
        message: validationMessages[0],
        errors: validationMessages,
      });
    }

    next(error);
  }
}

export async function getHolidays(req, res, next) {
  try {
    const requestedYear = req.query.year;

    const year = requestedYear ? Number(requestedYear) : new Date().getUTCFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid holiday year",
      });
    }

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

    if (!mongoose.isValidObjectId(holidayId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    if (hasOwn(req.body, "isActive")) {
      return res.status(400).json({
        success: false,
        message: "isActive cannot be updated through this endpoint",
      });
    }

    const providedFields = EDITABLE_HOLIDAY_FIELDS.filter((field) => hasOwn(req.body, field));

    if (providedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No editable holiday fields were provided",
      });
    }

    const holiday = await Holiday.findById(holidayId);
    const auditBeforeHoliday = holiday.toObject();

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    if (hasOwn(req.body, "date")) {
      const parsedDate = parseDateOnly(req.body.date);

      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message: "Holiday date must be a valid date in YYYY-MM-DD format",
        });
      }

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
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A holiday already exists on the selected date",
      });
    }

    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors).map((validationError) => validationError.message);

      return res.status(400).json({
        success: false,
        message: validationMessages[0],
        errors: validationMessages,
      });
    }

    next(error);
  }
}

export async function updateHolidayStatus(req, res, next) {
  try {
    const { holidayId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(holidayId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const holiday = await Holiday.findById(holidayId);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    if (holiday.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: isActive ? "Holiday is already active" : "Holiday is already inactive",
      });
    }

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
