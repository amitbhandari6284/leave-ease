import mongoose from "mongoose";

import LeaveType from "./leaveType.model.js";
import { USER_ROLES } from "../../constants/roles.js";
import { AppError } from "../../utils/AppError.js";

export async function createLeaveType(req, res, next) {
  try {
    const {
      name,
      code,
      description = "",
      yearlyAllowance,
      maxConsecutiveDays = 5,
      carryForwardLimit = 0,
      allowHalfDay = false,
      isPaid = true,
      requiresDocument = false,
      documentRequiredAfterDays = null,
      genderRestriction = "NONE",
      color = "#4F46E5",
    } = req.body;

    if (!name || !code || yearlyAllowance === undefined)
      throw new AppError("Name, code and yearly allowance are required", 400, "MISSING_FIELDS");

    if (typeof yearlyAllowance !== "number" || yearlyAllowance < 0)
      throw new AppError("Yearly allowance must be a non-negative number", 400, "INVALID_YEARLY_ALLOWANCE");

    if (requiresDocument && documentRequiredAfterDays === null)
      throw new AppError(
        "Document required after days must be provided when documents are required",
        400,
        "DOCUMENT_THRESHOLD_REQUIRED",
      );

    if (!requiresDocument && documentRequiredAfterDays !== null)
      throw new AppError(
        "Document required after days should be null when documents are not required",
        400,
        "DOCUMENT_THRESHOLD_NOT_ALLOWED",
      );

    const leaveType = await LeaveType.create({
      name,
      code,
      description,
      yearlyAllowance,
      maxConsecutiveDays,
      carryForwardLimit,
      allowHalfDay,
      isPaid,
      requiresDocument,
      documentRequiredAfterDays,
      genderRestriction,
      color,
    });

    return res.status(201).json({
      success: true,
      message: "Leave type created successfully",
      leaveType,
    });
  } catch (error) {
    // Duplicate-key (E11000) and ValidationError are normalized centrally
    // by errorHandler.js — no need to catch them here.
    next(error);
  }
}

export async function getLeaveTypes(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true" && req.user.role === USER_ROLES.ADMIN;

    const filter = includeInactive
      ? {}
      : {
          isActive: true,
        };

    const leaveTypes = await LeaveType.find(filter).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: leaveTypes.length,
      leaveTypes,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLeaveType(req, res, next) {
  try {
    const { leaveTypeId } = req.params;

    if (!mongoose.isValidObjectId(leaveTypeId)) throw new AppError("Invalid leave type ID", 400, "INVALID_IDENTIFIER");

    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!leaveType) throw new AppError("Leave type not found", 404, "LEAVE_TYPE_NOT_FOUND");

    const allowedFields = [
      "name",
      "code",
      "description",
      "yearlyAllowance",
      "maxConsecutiveDays",
      "carryForwardLimit",
      "allowHalfDay",
      "isPaid",
      "requiresDocument",
      "documentRequiredAfterDays",
      "genderRestriction",
      "color",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        leaveType[field] = req.body[field];
      }
    }

    /*
      If documents are not required, the threshold should not
      retain an old value.
    */
    if (leaveType.requiresDocument === false) {
      leaveType.documentRequiredAfterDays = null;
    }

    /*
      If documents are required, a threshold must exist.
    */
    if (leaveType.requiresDocument === true && leaveType.documentRequiredAfterDays === null)
      throw new AppError(
        "Document required after days must be provided when documents are required",
        400,
        "DOCUMENT_THRESHOLD_REQUIRED",
      );

    await leaveType.save();

    return res.status(200).json({
      success: true,
      message: "Leave type updated successfully",
      leaveType,
    });
  } catch (error) {
    // Duplicate-key (E11000) and ValidationError are normalized centrally
    // by errorHandler.js — no need to catch them here.
    next(error);
  }
}

export async function updateLeaveTypeStatus(req, res, next) {
  try {
    const { leaveTypeId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(leaveTypeId)) throw new AppError("Invalid leave type ID", 400, "INVALID_IDENTIFIER");

    if (typeof isActive !== "boolean") throw new AppError("isActive must be either true or false", 400, "INVALID_BOOLEAN_VALUE");

    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!leaveType) throw new AppError("Leave type not found", 404, "LEAVE_TYPE_NOT_FOUND");

    leaveType.isActive = isActive;

    await leaveType.save();

    return res.status(200).json({
      success: true,
      message: isActive ? "Leave type activated successfully" : "Leave type deactivated successfully",
      leaveType,
    });
  } catch (error) {
    next(error);
  }
}
