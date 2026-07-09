import mongoose from "mongoose";

import User from "./user.model.js";
import Department from "../departments/department.model.js";
import LeaveRequest from "../leaveRequests/leaveRequest.model.js";

import { USER_ROLES, USER_ROLE_VALUES } from "../../constants/roles.js";
import { LEAVE_STATUSES } from "../../constants/leaveStatuses.js";

import { buildAuditChanges, createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";
import { initializeLeaveBalancesForUser } from "../leaveBalances/leaveBalance.service.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";

const EDITABLE_USER_FIELDS = [
  "name",
  "email",
  "employeeId",
  "role",
  "department",
  "manager",
  "designation",
  "phone",
  "joinDate",
  "avatarUrl",
];

const RESTRICTED_USER_FIELDS = ["password", "isActive", "mustChangePassword", "lastLoginAt"];

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function normalizeNullableId(value) {
  if (value === null || value === "") {
    return null;
  }

  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function validateDepartment(departmentId) {
  if (!mongoose.isValidObjectId(departmentId))
    throw new AppError("The provided department ID is invalid.", 400, "INVALID_IDENTIFIER");

  const department = await Department.findById(departmentId);
  if (!department) throw new AppError("The requested department does not exist.", 404, "DEPARTMENT_NOT_FOUND");

  if (!department.isActive) throw new AppError("Selected department is inactive", 400, "INACTIVE_ACCOUNT");

  return department;
}

async function validateManager(managerId) {
  if (!managerId) return null;

  if (!mongoose.isValidObjectId(managerId)) throw new AppError("The provided manager ID is invalid.", 400, "INVALID_IDENTIFIER");

  const manager = await User.findById(managerId);
  if (!manager) throw new AppError("The requested manager does not exist.", 404, "MANAGER_NOT_FOUND");

  if (!manager.isActive) throw new AppError("Selected manager is inactive", 400, "INACTIVE_ACCOUNT");

  if (manager.role !== USER_ROLES.HR_MANAGER)
    throw new Error("The assigned manager must hold the HR Manager role.", 400, "INVALID_MANAGER_ROLE");

  return manager;
}

export async function createUser(req, res, next) {
  try {
    const {
      name,
      email,
      employeeId,
      password,
      role = USER_ROLES.EMPLOYEE,
      department = null,
      manager = null,
      designation = "",
      phone = "",
      joinDate,
    } = req.body;

    if (!name || !email || !employeeId || !password)
      throw new AppError("Name, EmployeeId, Email and temporary Password are required", 400, "MISSING_CREDENTIALS");

    if (!USER_ROLE_VALUES.includes(role))
      throw new AppError(
        `The specified role is invalid. It must be one of the following: ${USER_ROLE_VALUES.join(", ")}.`,
        400,
        "INVALID_USER_ROLE",
      );

    if (role !== USER_ROLES.ADMIN && !department)
      throw new AppError("A department assignment is required for Employees and HR Managers.", 400, "DEPARTMENT_REQUIRED");

    if (role === USER_ROLES.ADMIN && (department || manager))
      throw new AppError(
        "Administrator accounts cannot be assigned to a department or a manager.",
        400,
        "ADMIN_ASSIGNMENT_FORBIDDEN",
      );

    if (department) {
      await validateDepartment(department);
    }

    if (manager) {
      const selectedManager = await validateManager(manager);

      if (selectedManager.department && selectedManager.department.toString() !== department)
        throw new AppError(
          "The selected manager belongs to a different department than the user.",
          400,
          "MANAGER_DEPARTMENT_MISMATCH",
        );
    }

    const user = await User.create({
      name,
      email,
      employeeId,
      password,
      role,
      department,
      manager,
      designation,
      phone,
      joinDate: joinDate || undefined,
      mustChangePassword: true,
    });

    let createdBalances = [];
    if (user.role !== USER_ROLES.ADMIN) {
      try {
        createdBalances = await initializeLeaveBalancesForUser(user._id);
      } catch (error) {
        await User.findByIdAndDelete(user._id);
        throw error;
      }
    }
    await runAuditTask("user-created", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: user._id,
        description: `Created user ${user.employeeId}.`,

        changes: {
          role: {
            from: null,
            to: user.role,
          },
          department: {
            from: null,
            to: user.department?._id?.toString() || user.department?.toString() || null,
          },
          manager: {
            from: null,
            to: user.manager?._id?.toString() || user.manager?.toString() || null,
          },
        },

        metadata: {
          employeeId: user.employeeId,
          email: user.email,
        },

        request: req,
      }),
    );

    await user.populate([
      {
        path: "department",
        select: "name code isActive",
      },
      {
        path: "manager",
        select: "name email employeeId role designation",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      balancesCreated: createdBalances.length,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { search = "", role, department, isActive, page = "1", limit = "10" } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 50",
      });
    }

    const filter = {};

    const trimmedSearch = typeof search === "string" ? search.trim() : "";

    if (trimmedSearch) {
      const escapedSearch = escapeRegex(trimmedSearch);

      filter.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          employeeId: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          designation: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    if (role) {
      const normalizedRole = role.trim().toUpperCase();

      if (!USER_ROLE_VALUES.includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: `Role must be one of: ${USER_ROLE_VALUES.join(", ")}`,
        });
      }

      filter.role = normalizedRole;
    }

    if (department) {
      if (!mongoose.isValidObjectId(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const departmentExists = await Department.exists({
        _id: department,
      });

      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      filter.department = department;
    }

    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = isActive === "true";
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .populate("department", "name code isActive")
        .populate("manager", "name email employeeId designation role")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit),

      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / parsedLimit);

    return res.status(200).json({
      success: true,

      filters: {
        search: trimmedSearch || null,
        role: role ? role.trim().toUpperCase() : null,
        department: department || null,
        isActive: isActive === undefined ? null : isActive === "true",
      },

      count: users.length,
      users,

      pagination: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalUsers,
        totalPages,
        hasPreviousPage: parsedPage > 1,
        hasNextPage: parsedPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const restrictedField = RESTRICTED_USER_FIELDS.find((field) => hasOwn(req.body, field));

    if (restrictedField) {
      return res.status(400).json({
        success: false,
        message: `${restrictedField} cannot be updated through this endpoint`,
      });
    }

    const providedFields = EDITABLE_USER_FIELDS.filter((field) => hasOwn(req.body, field));

    if (providedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No editable user fields were provided",
      });
    }

    const user = await User.findById(userId);

    const auditBeforeUser = user.toObject();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const nextRole = hasOwn(req.body, "role") ? String(req.body.role).trim().toUpperCase() : user.role;

    if (!USER_ROLE_VALUES.includes(nextRole)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${USER_ROLE_VALUES.join(", ")}`,
      });
    }

    /*
      For the MVP, administrator accounts cannot be created
      or removed through a general user-edit endpoint.
    */
    if (user.role === USER_ROLES.ADMIN && nextRole !== USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: "An Administrator account cannot be changed to another role",
      });
    }

    if (user.role !== USER_ROLES.ADMIN && nextRole === USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: "A user cannot be promoted to Administrator through this endpoint",
      });
    }

    /*
      Prevent an HR Manager from becoming an employee while
      departments or users still depend on them as manager.
    */
    if (user.role === USER_ROLES.HR_MANAGER && nextRole !== USER_ROLES.HR_MANAGER) {
      const [managedDepartment, managedUser] = await Promise.all([
        Department.exists({
          manager: user._id,
        }),

        User.exists({
          manager: user._id,
        }),
      ]);

      if (managedDepartment) {
        return res.status(409).json({
          success: false,
          message: "Reassign the departments managed by this user before changing their role",
        });
      }

      if (managedUser) {
        return res.status(409).json({
          success: false,
          message: "Reassign employees reporting to this user before changing their role",
        });
      }
    }

    let nextDepartment = hasOwn(req.body, "department")
      ? normalizeNullableId(req.body.department)
      : user.department?.toString() || null;

    let nextManager = hasOwn(req.body, "manager") ? normalizeNullableId(req.body.manager) : user.manager?.toString() || null;

    /*
      Admin accounts do not belong to departments and do not
      report to an HR Manager.
    */
    if (nextRole === USER_ROLES.ADMIN) {
      if (hasOwn(req.body, "department") && nextDepartment !== null) {
        return res.status(400).json({
          success: false,
          message: "Administrator accounts cannot belong to a department",
        });
      }

      if (hasOwn(req.body, "manager") && nextManager !== null) {
        return res.status(400).json({
          success: false,
          message: "Administrator accounts cannot have a manager",
        });
      }

      nextDepartment = null;
      nextManager = null;
    } else {
      if (!nextDepartment) {
        return res.status(400).json({
          success: false,
          message: "A department is required for Employees and HR Managers",
        });
      }

      if (!mongoose.isValidObjectId(nextDepartment)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const selectedDepartment = await Department.findOne({
        _id: nextDepartment,
        isActive: true,
      });

      if (!selectedDepartment) {
        return res.status(404).json({
          success: false,
          message: "Department does not exist or is inactive",
        });
      }

      if (nextManager) {
        if (!mongoose.isValidObjectId(nextManager)) {
          return res.status(400).json({
            success: false,
            message: "Invalid manager ID",
          });
        }

        if (nextManager.toString() === user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: "A user cannot be their own manager",
          });
        }

        const selectedManager = await User.findOne({
          _id: nextManager,
          role: USER_ROLES.HR_MANAGER,
          isActive: true,
        });

        if (!selectedManager) {
          return res.status(400).json({
            success: false,
            message: "Manager must be an active HR Manager",
          });
        }

        if (!selectedManager.department || selectedManager.department.toString() !== nextDepartment.toString()) {
          return res.status(400).json({
            success: false,
            message: "Manager and user must belong to the same department",
          });
        }
      }
    }

    for (const field of providedFields) {
      if (field === "role" || field === "department" || field === "manager") {
        continue;
      }

      user[field] = req.body[field];
    }

    user.role = nextRole;
    user.department = nextDepartment;
    user.manager = nextManager;

    await user.save();

    const userChanges = buildAuditChanges(auditBeforeUser, user.toObject(), EDITABLE_USER_FIELDS);

    await runAuditTask("user-updated", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.USER_UPDATED,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: user._id,
        description: `Updated user ${user.employeeId}.`,
        changes: userChanges,
        metadata: {
          employeeId: user.employeeId,
        },
        request: req,
      }),
    );

    await user.populate([
      {
        path: "department",
        select: "name code isActive",
      },
      {
        path: "manager",
        select: "name email employeeId designation role",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: duplicateField
          ? `A user with this ${duplicateField} already exists`
          : "A user with these details already exists",
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

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: isActive ? "User account is already active" : "User account is already inactive",
      });
    }

    /*
      Administrator accounts are protected from this endpoint.
    */
    if (user.role === USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be activated or deactivated through this endpoint",
      });
    }

    /*
      Extra self-protection in case the authorization model
      changes later.
    */
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    if (!isActive) {
      /*
        Pending requests reserve leave balance. Deactivating the
        user without resolving them would leave reserved balances.
      */
      const pendingLeaveRequest = await LeaveRequest.exists({
        employee: user._id,
        status: LEAVE_STATUSES.PENDING,
      });

      if (pendingLeaveRequest) {
        return res.status(409).json({
          success: false,
          message: "Resolve or cancel the user's pending leave requests before deactivating the account",
        });
      }

      /*
        HR Managers must be removed from organizational
        dependencies before being deactivated.
      */
      if (user.role === USER_ROLES.HR_MANAGER) {
        const [managedDepartment, managedEmployee] = await Promise.all([
          Department.exists({
            manager: user._id,
          }),

          User.exists({
            manager: user._id,
            isActive: true,
          }),
        ]);

        if (managedDepartment) {
          return res.status(409).json({
            success: false,
            message: "Reassign the departments managed by this user before deactivating the account",
          });
        }

        if (managedEmployee) {
          return res.status(409).json({
            success: false,
            message: "Reassign employees reporting to this user before deactivating the account",
          });
        }
      }
    }

    /*
      Before reactivation, ensure non-admin users still belong
      to an active department.
    */
    if (isActive) {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Assign the user to a department before reactivating the account",
        });
      }

      const activeDepartment = await Department.findOne({
        _id: user.department,
        isActive: true,
      });

      if (!activeDepartment) {
        return res.status(400).json({
          success: false,
          message: "The user's department must be active before reactivating the account",
        });
      }

      /*
        If the user has a manager, the manager must still be an
        active HR Manager in the same department.
      */
      if (user.manager) {
        const activeManager = await User.findOne({
          _id: user.manager,
          role: USER_ROLES.HR_MANAGER,
          department: user.department,
          isActive: true,
        });

        if (!activeManager) {
          return res.status(400).json({
            success: false,
            message: "Assign a valid active manager before reactivating the account",
          });
        }
      }
    }

    user.isActive = isActive;

    await user.save();

    await runAuditTask("user-status-changed", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: user._id,
        description: isActive ? `Activated user ${user.employeeId}.` : `Deactivated user ${user.employeeId}.`,
        changes: {
          isActive: {
            from: !isActive,
            to: isActive,
          },
        },
        metadata: {
          employeeId: user.employeeId,
        },
        request: req,
      }),
    );
    await user.populate([
      {
        path: "department",
        select: "name code isActive",
      },
      {
        path: "manager",
        select: "name email employeeId designation role isActive",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: isActive ? "User account activated successfully" : "User account deactivated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}
