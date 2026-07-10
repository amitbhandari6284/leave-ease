import mongoose from "mongoose";

import User from "./user.model.js";
import Department from "../departments/department.model.js";
import LeaveRequest from "../leaveRequests/leaveRequest.model.js";

import { USER_ROLES, USER_ROLE_VALUES } from "../../constants/roles.js";
import { LEAVE_STATUSES } from "../../constants/leaveStatuses.js";

import { buildAuditChanges, createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";
import { initializeLeaveBalancesForUser } from "../leaveBalances/leaveBalance.service.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";
import { AppError } from "../../utils/AppError.js";

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

// Used everywhere we send a user back to the client, so the shape stays
// consistent across create/update/status endpoints instead of drifting.
const USER_POPULATE_OPTIONS = [
  { path: "department", select: "name code isActive" },
  { path: "manager", select: "name email employeeId role designation isActive" },
];

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
    // Was `new Error(...)` before - regular Error ignores the status/code args,
    // so this was silently turning into a generic 500 instead of a 400.
    throw new AppError("The assigned manager must hold the HR Manager role.", 400, "INVALID_MANAGER_ROLE");

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
        // Balance init failed, so roll back the user we just created and bail out.
        // Missing `return` here used to let the function fall through to the
        // audit log + success response even after deleting the user.
        await User.findByIdAndDelete(user._id);
        return next(error);
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

    await user.populate(USER_POPULATE_OPTIONS);

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

    if (!Number.isInteger(parsedPage) || parsedPage < 1)
      throw new AppError("Page must be a positive integer", 400, "INVALID_PAGINATION_PAGE");

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50)
      throw new AppError("The limit parameter must be an integer between 1 and 50.", 400, "INVALID_PAGINATION_LIMIT");

    const filter = {};

    // computed once here so we don't redo the trim/uppercase down in the
    // `filters` block of the response
    const normalizedRole = typeof role === "string" ? role.trim().toUpperCase() : null;

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

    if (normalizedRole) {
      if (!USER_ROLE_VALUES.includes(normalizedRole))
        throw new AppError(
          `The specified role filter is invalid. It must be one of the following: ${USER_ROLE_VALUES.join(", ")}.`,
          400,
          "INVALID_FILTER_ROLE",
        );

      filter.role = normalizedRole;
    }

    if (department) {
      if (!mongoose.isValidObjectId(department))
        throw new AppError("The provided department filter ID is invalid.", 400, "INVALID_IDENTIFIER");

      const departmentExists = await Department.exists({
        _id: department,
      });

      if (!departmentExists) throw new AppError("The requested department does not exist.", 404, "DEPARTMENT_NOT_FOUND");

      filter.department = department;
    }

    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false")
        throw new AppError("The isActive parameter must be a valid boolean value (true or false).", 400, "INVALID_BOOLEAN_VALUE");

      filter.isActive = isActive === "true";
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .populate(USER_POPULATE_OPTIONS)
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
        role: normalizedRole,
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

    if (!mongoose.isValidObjectId(userId)) throw new AppError("The provided user ID is invalid.", 400, "INVALID_IDENTIFIER");

    const restrictedField = RESTRICTED_USER_FIELDS.find((field) => hasOwn(req.body, field));

    if (restrictedField)
      throw new AppError(
        `The field '${restrictedField}' is read-only and cannot be updated through this endpoint.`,
        400,
        "RESTRICTED_FIELD_UPDATE",
      );

    const providedFields = EDITABLE_USER_FIELDS.filter((field) => hasOwn(req.body, field));

    if (providedFields.length === 0)
      throw new AppError("No editable fields were provided in the request body.", 400, "MISSING_UPDATE_DATA");

    const user = await User.findById(userId);

    if (!user) throw new AppError("The requested user could not be found.", 404, "USER_NOT_FOUND");

    // Snapshot before we start mutating, so buildAuditChanges has something to diff against.
    const auditBeforeUser = user.toObject();

    const nextRole = hasOwn(req.body, "role") ? String(req.body.role).trim().toUpperCase() : user.role;

    if (!USER_ROLE_VALUES.includes(nextRole))
      throw new AppError(
        `The specified role is invalid. It must be one of the following: ${USER_ROLE_VALUES.join(", ")}.`,
        400,
        "INVALID_FILTER_ROLE",
      );

    if (user.role === USER_ROLES.ADMIN && nextRole !== USER_ROLES.ADMIN)
      throw new AppError("An Administrator account cannot be changed to a different role.", 400, "ADMIN_ROLE_UPDATE_FORBIDDEN");

    if (user.role !== USER_ROLES.ADMIN && nextRole === USER_ROLES.ADMIN)
      throw new AppError(
        "A user cannot be promoted to the Administrator role through this endpoint.",
        400,
        "ADMIN_PROMOTION_FORBIDDEN",
      );

    // Prevent an HR Manager from becoming an employee while, departments or users still depend on them as manager.

    if (user.role === USER_ROLES.HR_MANAGER && nextRole !== USER_ROLES.HR_MANAGER) {
      const [managedDepartment, managedUser] = await Promise.all([
        Department.exists({
          manager: user._id,
        }),

        // isActive: true to match the same check in updateUserStatus - an
        // inactive report shouldn't block this manager's role change.
        User.exists({
          manager: user._id,
          isActive: true,
        }),
      ]);

      if (managedDepartment)
        throw new AppError(
          "Please reassign all departments managed by this user before changing their role.",
          409,
          "DEPARTMENTS_REASSIGNMENT_REQUIRED",
        );

      if (managedUser)
        throw new AppError(
          "Please reassign all departments managed by this user before changing their role.",
          409,
          "DEPARTMENTS_REASSIGNMENT_REQUIRED",
        );
    }

    let nextDepartment = hasOwn(req.body, "department")
      ? normalizeNullableId(req.body.department)
      : user.department?.toString() || null;

    let nextManager = hasOwn(req.body, "manager") ? normalizeNullableId(req.body.manager) : user.manager?.toString() || null;

    // Admin accounts do not belong to departments and do not report to an HR Manager.

    if (nextRole === USER_ROLES.ADMIN) {
      if (hasOwn(req.body, "department") && nextDepartment !== null)
        throw new AppError(
          "Administrator accounts cannot be assigned to a department.",
          400,
          "ADMIN_DEPARTMENT_ASSIGNMENT_FORBIDDEN",
        );
      if (hasOwn(req.body, "manager") && nextManager !== null)
        throw new AppError("Administrator accounts cannot be assigned to a manager.", 400, "ADMIN_MANAGER_ASSIGNMENT_FORBIDDEN");

      nextDepartment = null;
      nextManager = null;
    } else {
      if (!nextDepartment)
        throw new AppError("A department assignment is required for Employees and HR Managers.", 400, "DEPARTMENT_REQUIRED");

      if (!mongoose.isValidObjectId(nextDepartment))
        throw new AppError("The provided department ID is invalid.", 400, "INVALID_IDENTIFIER");

      const selectedDepartment = await Department.findOne({
        _id: nextDepartment,
        isActive: true,
      });

      if (!selectedDepartment) throw new AppError("The requested department does not exist.", 404, "DEPARTMENT_NOT_FOUND");

      if (nextManager) {
        if (!mongoose.isValidObjectId(nextManager))
          throw new AppError("The provided manager ID is invalid.", 400, "INVALID_IDENTIFIER");

        // Was returning res.status(400).json(...) directly here, which skips
        // the AppError -> next(error) pipeline everything else uses.
        if (nextManager.toString() === user._id.toString())
          throw new AppError("A user cannot be their own manager.", 400, "SELF_MANAGEMENT_FORBIDDEN");

        const selectedManager = await User.findOne({
          _id: nextManager,
          role: USER_ROLES.HR_MANAGER,
          isActive: true,
        });

        // Note: this message used to say "cannot be assigned as their own manager",
        // which was copy-pasted from the self-manager check above and didn't
        // actually describe this case (manager missing / not an active HR Manager).
        if (!selectedManager) throw new AppError("The selected manager must be an active HR Manager.", 404, "MANAGER_NOT_FOUND");

        if (!selectedManager.department || selectedManager.department.toString() !== nextDepartment.toString())
          throw new AppError(
            "The selected manager must belong to the same department as the user.",
            400,
            "MANAGER_DEPARTMENT_MISMATCH",
          );
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

    await user.populate(USER_POPULATE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(userId)) throw new AppError("The provided user ID is invalid.", 400, "INVALID_IDENTIFIER");

    if (typeof isActive !== "boolean")
      throw new AppError("The isActive parameter must be a valid boolean value (true or false).", 400, "INVALID_BOOLEAN_VALUE");

    const user = await User.findById(userId);

    if (!user) throw new AppError("User account not found.", 404, "USER_NOT_FOUND");

    if (user.isActive === isActive) {
      const code = req.body.isActive ? "USER_ALREADY_ACTIVE" : "USER_ALREADY_INACTIVE";
      const message = `The user account is already ${req.body.isActive ? "active" : "inactive"}.`;
      throw new AppError(message, 400, code);
    }

    /*
      Administrator accounts are protected from this endpoint.
    */
    if (user.role === USER_ROLES.ADMIN)
      throw new AppError(
        "Administrator accounts cannot be activated or deactivated through this endpoint.",
        403,
        "ADMIN_STATUS_MODIFICATION_FORBIDDEN",
      );

    /*
      Extra self-protection in case the authorization model
      changes later.
    */
    if (user._id.toString() === req.user._id.toString())
      throw new AppError("You cannot deactivate your own account.", 400, "SELF_DEACTIVATION_FORBIDDEN");

    if (!isActive) {
      /*
        Pending requests reserve leave balance. Deactivating the
        user without resolving them would leave reserved balances.
      */
      const pendingLeaveRequest = await LeaveRequest.exists({
        employee: user._id,
        status: LEAVE_STATUSES.PENDING,
      });

      if (pendingLeaveRequest)
        throw new AppError(
          "Please resolve or cancel the user's pending leave requests before deactivating their account.",
          409,
          "PENDING_LEAVE_REQUESTS_EXIST",
        );

      // HR Managers must be removed from organizational dependencies before being deactivated.
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

        if (managedDepartment)
          throw new AppError(
            "Please reassign all departments managed by this user before deactivating their account.",
            409,
            "DEPARTMENTS_REASSIGNMENT_REQUIRED",
          );

        if (managedEmployee)
          throw new AppError(
            "Please reassign all employees reporting to this user before deactivating their account.",
            409,
            "EMPLOYEE_REASSIGNMENT_REQUIRED",
          );
      }
    }

    // Before reactivation, ensure non-admin users still belong to an active department.
    if (isActive) {
      if (!user.department)
        throw new AppError(
          "Please assign the user to a department before reactivating their account.",
          400,
          "DEPARTMENT_ASSIGNMENT_REQUIRED",
        );

      const activeDepartment = await Department.findOne({
        _id: user.department,
        isActive: true,
      });

      if (!activeDepartment)
        throw new AppError("The user's department must be active before reactivating their account.", 400, "DEPARTMENT_INACTIVE");

      // If the user has a manager, the manager must still be an active HR Manager in the same department.
      if (user.manager) {
        const activeManager = await User.findOne({
          _id: user.manager,
          role: USER_ROLES.HR_MANAGER,
          department: user.department,
          isActive: true,
        });

        if (!activeManager)
          throw new AppError(
            "Please assign a valid, active manager before reactivating the account.",
            400,
            "ACTIVE_MANAGER_REQUIRED",
          );
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
    await user.populate(USER_POPULATE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: isActive ? "User account activated successfully" : "User account deactivated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}
