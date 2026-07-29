import mongoose from "mongoose";

import LeaveRequest from "./leaveRequest.model.js";
import LeaveType from "../leaveTypes/leaveType.model.js";
import LeaveBalance from "../leaveBalances/leaveBalance.model.js";
import Holiday from "../holidays/holiday.model.js";
import Department from "../departments/department.model.js";

import {
  notifyLeaveCancelled,
  notifyLeaveDecision,
  notifyLeaveSubmitted,
  runNotificationTask,
} from "../notifications/notification.service.js";
import { createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { calculateWorkingDays } from "../../utils/calculateWorkingDays.js";
import { parseDateOnly } from "../../utils/dateOnly.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";
import { LEAVE_STATUSES, LEAVE_STATUS_VALUES } from "../../constants/leaveStatuses.js";
import { USER_ROLES } from "../../constants/roles.js";
import { AppError } from "../../utils/AppError.js";

function getTodayDateOnly() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return parseDateOnly(formatter.format(new Date()));
}

function validateReason(reason) {
  if (typeof reason !== "string") {
    return "Leave reason is required";
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length < 10) {
    return "Leave reason must contain at least 10 characters";
  }
  if (trimmedReason.length > 500) {
    return "Leave reason cannot exceed 500 characters";
  }
  return null;
}

async function getHolidayDates(startDate, endDate) {
  const holidays = await Holiday.find({
    isActive: true,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).select("date");
  return holidays.map((holiday) => holiday.date);
}

async function reservePaidLeaveBalance({ userId, leaveTypeId, year, workingDays }) {
  /*
    available =
      entitled +
      carriedForward +
      adjustments -
      used -
      pending

    The $expr condition ensures that the balance is still
    sufficient when MongoDB performs the update.
  */
  return LeaveBalance.findOneAndUpdate(
    {
      user: userId,
      leaveType: leaveTypeId,
      year,

      $expr: {
        $gte: [
          {
            $subtract: [
              {
                $add: ["$entitled", "$carriedForward", "$adjustments"],
              },
              {
                $add: ["$used", "$pending"],
              },
            ],
          },
          workingDays,
        ],
      },
    },
    {
      $inc: {
        pending: workingDays,
      },
    },
    {
      // new: true,
      returnDocument: "after",
      runValidators: true,
    },
  );
}

async function releaseReservedBalance({ userId, leaveTypeId, year, workingDays }) {
  await LeaveBalance.updateOne(
    {
      user: userId,
      leaveType: leaveTypeId,
      year,
    },
    {
      $inc: {
        pending: -workingDays,
      },
    },
  );
}

export async function submitLeaveRequest(req, res, next) {
  let balanceReserved = false;
  let reservedBalanceDetails = null;

  try {
    const { leaveType: leaveTypeId, startDate, endDate, reason, attachmentUrl = "" } = req.body;

    if (!req.user.department)
      throw new AppError("You must be assigned to a department before applying for leave", 400, "DEPARTMENT_REQUIRED");

    if (!leaveTypeId || !startDate || !endDate || !reason)
      throw new AppError("Leave type, start date, end date and reason are required", 400, "MISSING_FIELDS");

    if (!mongoose.isValidObjectId(leaveTypeId)) throw new AppError("Invalid leave type ID", 400, "INVALID_IDENTIFIER");

    const reasonError = validateReason(reason);

    if (reasonError) throw new AppError(reasonError, 400, "INVALID_REASON");

    const parsedStartDate = parseDateOnly(startDate);
    const parsedEndDate = parseDateOnly(endDate);

    if (!parsedStartDate || !parsedEndDate)
      throw new AppError("Start date and end date must use the YYYY-MM-DD format", 400, "INVALID_DATE_FORMAT");

    if (parsedEndDate < parsedStartDate)
      throw new AppError("End date cannot be earlier than start date", 400, "INVALID_DATE_RANGE");

    const today = getTodayDateOnly();

    if (parsedStartDate < today) throw new AppError("Leave cannot be requested for a past date", 400, "PAST_DATE_NOT_ALLOWED");

    const startYear = parsedStartDate.getUTCFullYear();
    const endYear = parsedEndDate.getUTCFullYear();

    if (startYear !== endYear)
      throw new AppError("A leave request cannot span across two calendar years", 400, "CROSS_YEAR_REQUEST_NOT_ALLOWED");

    /*
      These three lookups don't depend on each other's results, so
      they run concurrently instead of one after another.
    */
    const [leaveType, holidayDates, overlappingRequest] = await Promise.all([
      LeaveType.findOne({
        _id: leaveTypeId,
        isActive: true,
      }),

      getHolidayDates(parsedStartDate, parsedEndDate),

      LeaveRequest.findOne({
        employee: req.user._id,

        status: {
          $in: [LEAVE_STATUSES.PENDING, LEAVE_STATUSES.APPROVED],
        },

        startDate: {
          $lte: parsedEndDate,
        },

        endDate: {
          $gte: parsedStartDate,
        },
      }),
    ]);

    if (!leaveType) throw new AppError("Leave type does not exist or is inactive", 404, "LEAVE_TYPE_NOT_FOUND");

    if (overlappingRequest)
      throw new AppError(
        "You already have a pending or approved leave request for overlapping dates",
        409,
        "OVERLAPPING_LEAVE_REQUEST",
      );

    const workingDays = calculateWorkingDays({
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      holidayDates,
    });

    if (workingDays < 1)
      throw new AppError("The selected range does not contain any working days", 400, "NO_WORKING_DAYS_SELECTED");

    if (workingDays > leaveType.maxConsecutiveDays)
      throw new AppError(
        `${leaveType.name} allows a maximum of ${leaveType.maxConsecutiveDays} consecutive working days`,
        400,
        "MAX_CONSECUTIVE_DAYS_EXCEEDED",
      );

    const documentIsRequired = leaveType.requiresDocument && workingDays >= leaveType.documentRequiredAfterDays;

    if (documentIsRequired && (!attachmentUrl || !attachmentUrl.trim()))
      throw new AppError(
        `A supporting document is required for ${leaveType.name} requests of ${leaveType.documentRequiredAfterDays} or more working days`,
        400,
        "DOCUMENT_REQUIRED",
      );

    /*
      Paid leave reserves balance while pending.

      Unpaid Leave skips this section because it does not
      depend on an annual entitlement.
    */
    if (leaveType.isPaid) {
      const balance = await reservePaidLeaveBalance({
        userId: req.user._id,
        leaveTypeId: leaveType._id,
        year: startYear,
        workingDays,
      });

      if (!balance) {
        const existingBalance = await LeaveBalance.findOne({
          user: req.user._id,
          leaveType: leaveType._id,
          year: startYear,
        });

        if (!existingBalance)
          throw new AppError("No leave balance exists for the selected leave type and year", 400, "LEAVE_BALANCE_NOT_FOUND");

        throw new AppError(`Insufficient ${leaveType.name} balance`, 400, "INSUFFICIENT_LEAVE_BALANCE");
      }

      balanceReserved = true;

      reservedBalanceDetails = {
        userId: req.user._id,
        leaveTypeId: leaveType._id,
        year: startYear,
        workingDays,
      };
    }

    let leaveRequest;

    try {
      leaveRequest = await LeaveRequest.create({
        employee: req.user._id,
        department: req.user.department,
        leaveType: leaveType._id,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        workingDays,
        reason: reason.trim(),
        attachmentUrl: attachmentUrl.trim(),
        status: LEAVE_STATUSES.PENDING,
      });
    } catch (error) {
      if (balanceReserved) {
        await releaseReservedBalance(reservedBalanceDetails);
      }

      throw error;
    }

    await runAuditTask("leave-submitted", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.LEAVE_SUBMITTED,
        entityType: AUDIT_ENTITY_TYPES.LEAVE_REQUEST,
        entityId: leaveRequest._id,
        description: "Employee submitted a leave request.",
        changes: {
          status: {
            from: null,
            to: LEAVE_STATUSES.PENDING,
          },
        },
        metadata: {
          employeeId: req.user._id.toString(),
          leaveTypeId: leaveType._id.toString(),
          departmentId: req.user.department.toString(),
          startDate: parsedStartDate.toISOString().slice(0, 10),
          endDate: parsedEndDate.toISOString().slice(0, 10),
          workingDays,
        },
        request: req,
      }),
    );

    await leaveRequest.populate([
      {
        path: "employee",
        select: "name email employeeId designation role department",
      },
      {
        path: "department",
        select: "name code",
      },
      {
        path: "leaveType",
        select: "name code color isPaid yearlyAllowance maxConsecutiveDays",
      },
    ]);

    await runNotificationTask("leave-submitted", () =>
      notifyLeaveSubmitted({
        leaveRequest,
      }),
    );

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leaveRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyLeaveRequests(req, res, next) {
  try {
    const { status, leaveType, year, page = "1", limit = "10" } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1)
      throw new AppError("Page must be a positive integer", 400, "INVALID_PAGINATION_PAGE");

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50)
      throw new AppError("Limit must be between 1 and 50", 400, "INVALID_PAGINATION_LIMIT");

    const filter = {
      employee: req.user._id,
    };

    if (status) {
      const normalizedStatus = status.trim().toUpperCase();

      if (!LEAVE_STATUS_VALUES.includes(normalizedStatus))
        throw new AppError(`Status must be one of: ${LEAVE_STATUS_VALUES.join(", ")}`, 400, "INVALID_STATUS_FILTER");

      filter.status = normalizedStatus;
    }

    if (leaveType) {
      if (!mongoose.isValidObjectId(leaveType)) throw new AppError("Invalid leave type ID", 400, "INVALID_IDENTIFIER");

      filter.leaveType = leaveType;
    }

    if (year !== undefined) {
      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100)
        throw new AppError("Please provide a valid year", 400, "INVALID_YEAR");

      filter.startDate = {
        $gte: new Date(Date.UTC(parsedYear, 0, 1)),
        $lt: new Date(Date.UTC(parsedYear + 1, 0, 1)),
      };
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [leaveRequests, totalRequests] = await Promise.all([
      LeaveRequest.find(filter)
        .populate("leaveType", "name code color isPaid maxConsecutiveDays")
        .populate("department", "name code")
        .populate("decidedBy", "name email employeeId role designation")
        .sort({
          submittedAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit),

      LeaveRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRequests / parsedLimit);

    return res.status(200).json({
      success: true,
      count: leaveRequests.length,
      leaveRequests,

      pagination: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalRequests,
        totalPages,
        hasPreviousPage: parsedPage > 1,
        hasNextPage: parsedPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelLeaveRequest(req, res, next) {
  try {
    const { leaveRequestId } = req.params;
    const { reason = "" } = req.body;

    if (!mongoose.isValidObjectId(leaveRequestId)) throw new AppError("Invalid leave request ID", 400, "INVALID_IDENTIFIER");

    if (typeof reason !== "string") throw new AppError("Cancellation reason must be text", 400, "INVALID_REASON");

    const trimmedReason = reason.trim();

    if (trimmedReason.length > 300)
      throw new AppError("Cancellation reason cannot exceed 300 characters", 400, "REASON_TOO_LONG");

    /*
      employee condition prevents one employee from cancelling
      another employee's request.
    */
    const existingRequest = await LeaveRequest.findOne({
      _id: leaveRequestId,
      employee: req.user._id,
    }).populate("leaveType", "name code color isPaid");

    if (!existingRequest) throw new AppError("Leave request not found", 404, "LEAVE_REQUEST_NOT_FOUND");

    if (existingRequest.status !== LEAVE_STATUSES.PENDING)
      throw new AppError("Only pending leave requests can be cancelled", 400, "LEAVE_REQUEST_NOT_PENDING");

    if (!existingRequest.leaveType)
      throw new AppError("The leave type associated with this request no longer exists", 500, "LEAVE_TYPE_MISSING");

    const cancelledAt = new Date();

    /*
      The status condition prevents cancellation if HR approves
      or rejects the request between our first read and this update.
    */
    const cancelledRequest = await LeaveRequest.findOneAndUpdate(
      {
        _id: leaveRequestId,
        employee: req.user._id,
        status: LEAVE_STATUSES.PENDING,
      },
      {
        $set: {
          status: LEAVE_STATUSES.CANCELLED,
          cancelledAt,
          cancellationReason: trimmedReason,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!cancelledRequest)
      throw new AppError("The request status changed before it could be cancelled", 409, "STATUS_CHANGED_MID_REQUEST");

    /*
      Paid leave reserved balance during submission.
      We now remove those days from pending.
    */
    if (existingRequest.leaveType.isPaid) {
      const balanceYear = existingRequest.startDate.getUTCFullYear();

      const updatedBalance = await LeaveBalance.findOneAndUpdate(
        {
          user: req.user._id,
          leaveType: existingRequest.leaveType._id,
          year: balanceYear,

          pending: {
            $gte: existingRequest.workingDays,
          },
        },
        {
          $inc: {
            pending: -existingRequest.workingDays,
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      if (!updatedBalance) {
        /*
          Restore the request to PENDING if the balance could
          not be restored, keeping both records consistent.
        */
        await LeaveRequest.updateOne(
          {
            _id: cancelledRequest._id,
            status: LEAVE_STATUSES.CANCELLED,
            cancelledAt,
          },
          {
            $set: {
              status: LEAVE_STATUSES.PENDING,
              cancelledAt: null,
              cancellationReason: "",
            },
          },
        );

        throw new AppError("Unable to restore the reserved leave balance", 500, "BALANCE_RESTORE_FAILED");
      }
    }
    await runAuditTask("leave-cancelled", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.LEAVE_CANCELLED,
        entityType: AUDIT_ENTITY_TYPES.LEAVE_REQUEST,
        entityId: cancelledRequest._id,
        description: "Employee cancelled a pending leave request.",
        changes: {
          status: {
            from: LEAVE_STATUSES.PENDING,
            to: LEAVE_STATUSES.CANCELLED,
          },
        },
        metadata: {
          employeeId: req.user._id.toString(),
          workingDays: cancelledRequest.workingDays,
        },
        request: req,
      }),
    );

    await cancelledRequest.populate([
      {
        path: "employee",
        select: "name email employeeId designation role department",
      },
      {
        path: "department",
        select: "name code",
      },
      {
        path: "leaveType",
        select: "name code color isPaid",
      },
    ]);

    await runNotificationTask("leave-cancelled", () =>
      notifyLeaveCancelled({
        leaveRequest: cancelledRequest,
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
      leaveRequest: cancelledRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewQueue(req, res, next) {
  try {
    const { status, department, leaveType, year, page = "1", limit = "10" } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1)
      throw new AppError("Page must be a positive integer", 400, "INVALID_PAGINATION_PAGE");

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50)
      throw new AppError("Limit must be between 1 and 50", 400, "INVALID_PAGINATION_LIMIT");

    const filter = {};

    if (status) {
      const normalizedStatus = status.trim().toUpperCase();
      if (!LEAVE_STATUS_VALUES.includes(normalizedStatus))
        throw new AppError(`Status must be one of: ${LEAVE_STATUS_VALUES.join(", ")}`, 400, "INVALID_STATUS_FILTER");
      filter.status = normalizedStatus;
    }
    /*
      HR Managers can only see requests from departments
      where they are assigned as the manager.
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      const managedDepartments = await Department.find({
        manager: req.user._id,
        isActive: true,
      }).select("_id");

      if (managedDepartments.length === 0)
        throw new AppError("You are not assigned as the manager of any active department", 403, "NO_MANAGED_DEPARTMENTS");

      filter.department = {
        $in: managedDepartments.map((managedDepartment) => managedDepartment._id),
      };
    }

    /*
      Admin can optionally filter by one department.
    */
    if (req.user.role === USER_ROLES.ADMIN && department) {
      if (!mongoose.isValidObjectId(department)) throw new AppError("Invalid department ID", 400, "INVALID_IDENTIFIER");

      const selectedDepartment = await Department.findById(department);

      if (!selectedDepartment) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");

      filter.department = department;
    }

    if (leaveType) {
      if (!mongoose.isValidObjectId(leaveType)) throw new AppError("Invalid leave type ID", 400, "INVALID_IDENTIFIER");

      filter.leaveType = leaveType;
    }

    if (year !== undefined) {
      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100)
        throw new AppError("Please provide a valid year", 400, "INVALID_YEAR");

      filter.startDate = {
        $gte: new Date(Date.UTC(parsedYear, 0, 1)),
        $lt: new Date(Date.UTC(parsedYear + 1, 0, 1)),
      };
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [leaveRequests, totalRequests] = await Promise.all([
      LeaveRequest.find(filter)
        .populate("employee", ["name", "email", "employeeId", "designation", "role", "department", "avatarUrl"].join(" "))
        .populate("department", "name code maximumConcurrentLeaves")
        .populate("leaveType", ["name", "code", "color", "isPaid", "requiresDocument", "documentRequiredAfterDays"].join(" "))
        .populate("decidedBy", "name email employeeId role designation")
        .sort({
          submittedAt: 1,
        })
        .skip(skip)
        .limit(parsedLimit),

      LeaveRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRequests / parsedLimit);

    return res.status(200).json({
      success: true,
      filters: {
        status: status ? status.trim().toUpperCase() : null,
        department: req.user.role === USER_ROLES.ADMIN ? department || null : "MANAGED_DEPARTMENTS",
        leaveType: leaveType || null,
        year: year ? Number(year) : null,
      },
      count: leaveRequests.length,
      leaveRequests,
      pagination: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalRequests,
        totalPages,
        hasPreviousPage: parsedPage > 1,
        hasNextPage: parsedPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function decideLeaveRequest(req, res, next) {
  try {
    const { leaveRequestId } = req.params;
    const { decision, remark = "" } = req.body;
    if (!mongoose.isValidObjectId(leaveRequestId)) throw new AppError("Invalid leave request ID", 400, "INVALID_IDENTIFIER");
    if (decision !== LEAVE_STATUSES.APPROVED && decision !== LEAVE_STATUSES.REJECTED)
      throw new AppError("Decision must be APPROVED or REJECTED", 400, "INVALID_DECISION");
    if (typeof remark !== "string") throw new AppError("Decision remark must be text", 400, "INVALID_REMARK");

    const trimmedRemark = remark.trim();
    if (decision === LEAVE_STATUSES.REJECTED && trimmedRemark.length < 5)
      throw new AppError("A rejection remark of at least 5 characters is required", 400, "REMARK_TOO_SHORT");
    if (trimmedRemark.length > 500) throw new AppError("Decision remark cannot exceed 500 characters", 400, "REMARK_TOO_LONG");
    const existingRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("leaveType", "name code color isPaid")
      .populate("department", "name code manager isActive");

    if (!existingRequest) throw new AppError("Leave request not found", 404, "LEAVE_REQUEST_NOT_FOUND");
    if (existingRequest.status !== LEAVE_STATUSES.PENDING)
      throw new AppError("Only pending leave requests can be approved or rejected", 400, "LEAVE_REQUEST_NOT_PENDING");
    if (!existingRequest.leaveType)
      throw new AppError("The leave type associated with this request no longer exists", 500, "LEAVE_TYPE_MISSING");
    if (!existingRequest.department)
      throw new AppError("The department associated with this request no longer exists", 500, "DEPARTMENT_MISSING");

    /*
      HR Managers may only decide requests from departments
      assigned to them.

      "department" was already populated above with "manager" and
      "isActive", so this is an in-memory check instead of a
      redundant Department.exists query.
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      const managesDepartment =
        existingRequest.department.isActive && existingRequest.department.manager?.toString() === req.user._id.toString();
      if (!managesDepartment)
        throw new AppError("You are not authorized to review requests from this department", 403, "DEPARTMENT_NOT_MANAGED");
    }

    /*
      An HR Manager may also submit their own leave request,
      but they must not approve or reject it themselves.
    */
    if (existingRequest.employee.toString() === req.user._id.toString())
      throw new AppError("You cannot approve or reject your own leave request", 403, "SELF_DECISION_FORBIDDEN");

    const decidedAt = new Date();
    /*
      The status condition prevents two managers from deciding
      the same request simultaneously.
    */
    const decidedRequest = await LeaveRequest.findOneAndUpdate(
      {
        _id: leaveRequestId,
        status: LEAVE_STATUSES.PENDING,
      },
      {
        $set: {
          status: decision,
          decidedBy: req.user._id,
          decidedAt,
          decisionRemark: trimmedRemark,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    if (!decidedRequest)
      throw new AppError("The request status changed before your decision could be saved", 409, "STATUS_CHANGED_MID_REQUEST");
    let updatedBalance = null;

    /*
      Paid leave reserved days in the pending field when the
      employee submitted the request.
    */
    if (existingRequest.leaveType.isPaid) {
      const balanceYear = existingRequest.startDate.getUTCFullYear();
      const balanceUpdate =
        decision === LEAVE_STATUSES.APPROVED
          ? {
            $inc: {
              pending: -existingRequest.workingDays,
              used: existingRequest.workingDays,
            },
          }
          : {
            $inc: {
              pending: -existingRequest.workingDays,
            },
          };
      updatedBalance = await LeaveBalance.findOneAndUpdate(
        {
          user: existingRequest.employee,
          leaveType: existingRequest.leaveType._id,
          year: balanceYear,

          pending: {
            $gte: existingRequest.workingDays,
          },
        },
        balanceUpdate,
        {
          returnDocument: "after",
          runValidators: true,
        },
      );
      if (!updatedBalance) {
        /*
          Restore the leave request to PENDING if its balance
          cannot be updated.
        */
        await LeaveRequest.updateOne(
          {
            _id: decidedRequest._id,
            status: decision,
            decidedAt,
          },
          {
            $set: {
              status: LEAVE_STATUSES.PENDING,
              decidedBy: null,
              decidedAt: null,
              decisionRemark: "",
            },
          },
        );

        throw new AppError("Unable to update the employee leave balance", 500, "BALANCE_UPDATE_FAILED");
      }
    }

    const auditAction = decision === LEAVE_STATUSES.APPROVED ? AUDIT_ACTIONS.LEAVE_APPROVED : AUDIT_ACTIONS.LEAVE_REJECTED;
    await runAuditTask("leave-decision", () =>
      createAuditLog({
        actor: req.user,
        action: auditAction,
        entityType: AUDIT_ENTITY_TYPES.LEAVE_REQUEST,
        entityId: decidedRequest._id,
        description: decision === LEAVE_STATUSES.APPROVED ? "Leave request was approved." : "Leave request was rejected.",
        changes: {
          status: {
            from: LEAVE_STATUSES.PENDING,
            to: decision,
          },
          decidedBy: {
            from: null,
            to: req.user._id.toString(),
          },
        },
        metadata: {
          employeeId: existingRequest.employee.toString(),
          departmentId: existingRequest.department._id.toString(),
          workingDays: existingRequest.workingDays,
        },
        request: req,
      }),
    );

    await decidedRequest.populate([
      {
        path: "employee",
        select: "name email employeeId designation role department avatarUrl",
      },
      {
        path: "department",
        select: "name code maximumConcurrentLeaves",
      },
      {
        path: "leaveType",
        select: "name code color isPaid",
      },
      {
        path: "decidedBy",
        select: "name email employeeId role designation",
      },
    ]);
    await runNotificationTask("leave-decision", () =>
      notifyLeaveDecision({
        leaveRequest: decidedRequest,
      }),
    );

    return res.status(200).json({
      success: true,
      message:
        decision === LEAVE_STATUSES.APPROVED ? "Leave request approved successfully" : "Leave request rejected successfully",
      leaveRequest: decidedRequest,
      leaveBalance: updatedBalance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveRequest(req, res, next) {
  try {
    const { leaveRequestId } = req.params;
    if (!mongoose.isValidObjectId(leaveRequestId)) throw new AppError("Invalid leave request ID", 400, "INVALID_IDENTIFIER");

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate(
        "employee",
        ["name", "email", "employeeId", "designation", "role", "department", "avatarUrl", "joinDate"].join(" "),
      )
      .populate("department", ["name", "code", "manager", "maximumConcurrentLeaves", "isActive"].join(" "))
      .populate(
        "leaveType",
        [
          "name",
          "code",
          "description",
          "color",
          "isPaid",
          "requiresDocument",
          "documentRequiredAfterDays",
          "yearlyAllowance",
          "maxConsecutiveDays",
        ].join(" "),
      )
      .populate("decidedBy", "name email employeeId role designation");
    if (!leaveRequest) throw new AppError("Leave request not found", 404, "LEAVE_REQUEST_NOT_FOUND");

    const currentUserId = req.user._id.toString();
    const employeeId = leaveRequest.employee?._id?.toString();
    const isOwnRequest = employeeId === currentUserId;

    /*
      Employees may only view their own requests.
    */
    if (req.user.role === USER_ROLES.EMPLOYEE && !isOwnRequest)
      throw new AppError("Leave request not found", 404, "LEAVE_REQUEST_NOT_FOUND");

    /*
      HR Managers may view:
      1. Their own leave requests
      2. Requests from departments they manage

      "department" is already populated with "manager" above, so
      this is an in-memory comparison instead of a redundant
      Department.exists query.
    */
    if (req.user.role === USER_ROLES.HR_MANAGER && !isOwnRequest) {
      const managesDepartment = leaveRequest.department?.manager?.toString() === req.user._id.toString();
      if (!managesDepartment) throw new AppError("Leave request not found", 404, "LEAVE_REQUEST_NOT_FOUND");
    }
    return res.status(200).json({
      success: true,
      leaveRequest,
    });
  } catch (error) {
    next(error);
  }
}
