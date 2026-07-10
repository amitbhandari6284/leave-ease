import mongoose from "mongoose";

import Department from "./department.model.js";
import User from "../users/user.model.js";

import { buildAuditChanges, createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { AppError } from "../../utils/AppError.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";
import { USER_ROLES } from "../../constants/roles.js";

// helps in making sure only valid hr manager can be assigned to department manager not simple employee
async function validateManager(managerId) {
  if (!managerId) {
    return null;
  }
  if (!mongoose.isValidObjectId(managerId)) throw new AppError("The provided manager ID is invalid.", 400, "INVALID_IDENTIFIER");
  const manager = await User.findById(managerId);
  if (!manager) throw new AppError("Selected manager does not exist", 404, "MANAGER_NOT_FOUND");
  if (!manager.isActive) throw new AppError("Selected manager account is inactive", 400, "INACTIVE_ACCOUNT");
  if (manager.role !== USER_ROLES.HR_MANAGER)
    throw new AppError("Department manager must have the HR_MANAGER role", 400, "INVALID_MANAGER_ROLE");
  return manager;
}

export async function createDepartment(req, res, next) {
  try {
    const { name, code, description = "", manager = null, maximumConcurrentLeaves = 3 } = req.body;
    if (!name || !code) throw new AppError("Department name and code are required", 400, "MISSING_FIELDS");
    if (manager) {
      await validateManager(manager);
    }
    const department = await Department.create({
      name,
      code,
      description,
      manager,
      maximumConcurrentLeaves,
    });
    await runAuditTask("department-created", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
        entityType: AUDIT_ENTITY_TYPES.DEPARTMENT,
        entityId: department._id,
        description: `Created department ${department.name}.`,
        changes: {
          name: {
            from: null,
            to: department.name,
          },
          code: {
            from: null,
            to: department.code,
          },
          manager: {
            from: null,
            to: department.manager?.toString() || null,
          },
        },
        request: req,
      }),
    );
    await department.populate("manager", "name email employeeId role designation");
    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartments(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true" && req.user.role === USER_ROLES.ADMIN;
    const filter = includeInactive ? {} : { isActive: true };
    const departments = await Department.find(filter)
      .populate("manager", "name email employeeId role designation")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartment(req, res, next) {
  try {
    const { departmentId } = req.params;
    if (!mongoose.isValidObjectId(departmentId)) throw new AppError("Invalid department ID", 400, "INVALID_IDENTIFIER");
    const department = await Department.findById(departmentId).populate("manager", "name email employeeId role designation");
    if (!department) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    return res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { departmentId } = req.params;
    if (!mongoose.isValidObjectId(departmentId)) throw new AppError("Invalid department ID", 400, "INVALID_IDENTIFIER");
    const department = await Department.findById(departmentId);
    // Bug fix: null-check now happens before .toObject() is called,
    // instead of after (which crashed on a genuine 404).
    if (!department) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    const auditBeforeDepartment = department.toObject();
    const allowedFields = ["name", "code", "description", "manager", "maximumConcurrentLeaves"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        department[field] = req.body[field];
      }
    }
    if (req.body.manager !== undefined && req.body.manager !== null) {
      await validateManager(req.body.manager);
    }
    await department.save();
    const departmentChanges = buildAuditChanges(auditBeforeDepartment, department.toObject(), [
      "name",
      "code",
      "description",
      "manager",
      "maximumConcurrentLeaves",
    ]);
    await runAuditTask("department-updated", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
        entityType: AUDIT_ENTITY_TYPES.DEPARTMENT,
        entityId: department._id,
        description: `Updated department ${department.name}.`,
        changes: departmentChanges,
        request: req,
      }),
    );
    await department.populate("manager", "name email employeeId role designation");
    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentStatus(req, res, next) {
  try {
    const { departmentId } = req.params;
    const { isActive } = req.body;
    if (!mongoose.isValidObjectId(departmentId)) throw new AppError("Invalid department ID", 400, "INVALID_IDENTIFIER");
    if (typeof isActive !== "boolean") throw new AppError("isActive must be either true or false", 400, "INVALID_BOOLEAN_VALUE");
    const department = await Department.findByIdAndUpdate(
      departmentId,
      { isActive },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("manager", "name email employeeId role designation");
    if (!department) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    await runAuditTask("department-status-changed", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.DEPARTMENT_STATUS_CHANGED,
        entityType: AUDIT_ENTITY_TYPES.DEPARTMENT,
        entityId: department._id,
        description: isActive ? `Activated department ${department.name}.` : `Deactivated department ${department.name}.`,
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
      message: isActive ? "Department activated successfully" : "Department deactivated successfully",
      department,
    });
  } catch (error) {
    next(error);
  }
}
