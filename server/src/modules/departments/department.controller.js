import mongoose from "mongoose";

import Department from "./department.model.js";
import User from "../users/user.model.js";

import { buildAuditChanges, createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";
import { USER_ROLES } from "../../constants/roles.js";

// helps in making sure only valid hr manager can be assigned to department manager not simple employee
async function validateManager(managerId) {
  if (!managerId) {
    return null;
  }

  if (!mongoose.isValidObjectId(managerId)) {
    const error = new Error("Invalid manager ID");
    error.statusCode = 400;
    throw error;
  }

  const manager = await User.findById(managerId);

  if (!manager) {
    const error = new Error("Selected manager does not exist");
    error.statusCode = 404;
    throw error;
  }

  if (!manager.isActive) {
    const error = new Error("Selected manager account is inactive");
    error.statusCode = 400;
    throw error;
  }

  if (manager.role !== USER_ROLES.HR_MANAGER) {
    const error = new Error("Department manager must have the HR_MANAGER role");
    error.statusCode = 400;
    throw error;
  }

  return manager;
}

export async function createDepartment(req, res, next) {
  try {
    const { name, code, description = "", manager = null, maximumConcurrentLeaves = 3 } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Department name and code are required",
      });
    }

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
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];

      return res.status(409).json({
        success: false,
        message: `A department with this ${duplicateField} already exists`,
      });
    }

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

    if (!mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(departmentId).populate("manager", "name email employeeId role designation");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

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

    if (!mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(departmentId);
    const auditBeforeDepartment = department.toObject();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

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
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];

      return res.status(409).json({
        success: false,
        message: `A department with this ${duplicateField} already exists`,
      });
    }

    next(error);
  }
}

export async function updateDepartmentStatus(req, res, next) {
  try {
    const { departmentId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be either true or false",
      });
    }

    const department = await Department.findByIdAndUpdate(
      departmentId,
      {
        isActive,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("manager", "name email employeeId role designation");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }
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
