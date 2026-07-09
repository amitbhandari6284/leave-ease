import mongoose from "mongoose";

import LeaveType from "./leaveType.model.js";
import { USER_ROLES } from "../../constants/roles.js";

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

    if (!name || !code || yearlyAllowance === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, code and yearly allowance are required",
      });
    }

    if (typeof yearlyAllowance !== "number" || yearlyAllowance < 0) {
      return res.status(400).json({
        success: false,
        message: "Yearly allowance must be a non-negative number",
      });
    }

    if (requiresDocument && documentRequiredAfterDays === null) {
      return res.status(400).json({
        success: false,
        message: "Document required after days must be provided when documents are required",
      });
    }

    if (!requiresDocument && documentRequiredAfterDays !== null) {
      return res.status(400).json({
        success: false,
        message: "Document required after days should be null when documents are not required",
      });
    }

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
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue || error.keyPattern || {})[0] || "field";

      return res.status(409).json({
        success: false,
        message: `A leave type with this ${duplicateField} already exists`,
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

    if (!mongoose.isValidObjectId(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID",
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

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
    if (leaveType.requiresDocument === true && leaveType.documentRequiredAfterDays === null) {
      return res.status(400).json({
        success: false,
        message: "Document required after days must be provided when documents are required",
      });
    }

    await leaveType.save();

    return res.status(200).json({
      success: true,
      message: "Leave type updated successfully",
      leaveType,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue || error.keyPattern || {})[0] || "field";

      return res.status(409).json({
        success: false,
        message: `A leave type with this ${duplicateField} already exists`,
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

export async function updateLeaveTypeStatus(req, res, next) {
  try {
    const { leaveTypeId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be either true or false",
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

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
