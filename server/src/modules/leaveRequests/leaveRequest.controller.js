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

    if (!req.user.department) {
      return res.status(400).json({
        success: false,
        message: "You must be assigned to a department before applying for leave",
      });
    }

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Leave type, start date, end date and reason are required",
      });
    }

    if (!mongoose.isValidObjectId(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID",
      });
    }

    const reasonError = validateReason(reason);

    if (reasonError) {
      return res.status(400).json({
        success: false,
        message: reasonError,
      });
    }

    const parsedStartDate = parseDateOnly(startDate);
    const parsedEndDate = parseDateOnly(endDate);

    if (!parsedStartDate || !parsedEndDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date must use the YYYY-MM-DD format",
      });
    }

    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date",
      });
    }

    const today = getTodayDateOnly();

    if (parsedStartDate < today) {
      return res.status(400).json({
        success: false,
        message: "Leave cannot be requested for a past date",
      });
    }

    const startYear = parsedStartDate.getUTCFullYear();
    const endYear = parsedEndDate.getUTCFullYear();

    if (startYear !== endYear) {
      return res.status(400).json({
        success: false,
        message: "A leave request cannot span across two calendar years",
      });
    }

    const leaveType = await LeaveType.findOne({
      _id: leaveTypeId,
      isActive: true,
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type does not exist or is inactive",
      });
    }

    const holidayDates = await getHolidayDates(parsedStartDate, parsedEndDate);

    const workingDays = calculateWorkingDays({
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      holidayDates,
    });

    if (workingDays < 1) {
      return res.status(400).json({
        success: false,
        message: "The selected range does not contain any working days",
      });
    }

    if (workingDays > leaveType.maxConsecutiveDays) {
      return res.status(400).json({
        success: false,
        message: `${leaveType.name} allows a maximum of ${leaveType.maxConsecutiveDays} consecutive working days`,
      });
    }

    const documentIsRequired = leaveType.requiresDocument && workingDays >= leaveType.documentRequiredAfterDays;

    if (documentIsRequired && (!attachmentUrl || !attachmentUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: `A supporting document is required for ${leaveType.name} requests of ${leaveType.documentRequiredAfterDays} or more working days`,
      });
    }

    const overlappingRequest = await LeaveRequest.findOne({
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
    });

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending or approved leave request for overlapping dates",
      });
    }

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

        if (!existingBalance) {
          return res.status(400).json({
            success: false,
            message: "No leave balance exists for the selected leave type and year",
          });
        }

        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType.name} balance`,
        });
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

    const filter = {
      employee: req.user._id,
    };

    if (status) {
      const normalizedStatus = status.trim().toUpperCase();

      if (!LEAVE_STATUS_VALUES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${LEAVE_STATUS_VALUES.join(", ")}`,
        });
      }

      filter.status = normalizedStatus;
    }

    if (leaveType) {
      if (!mongoose.isValidObjectId(leaveType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave type ID",
        });
      }

      filter.leaveType = leaveType;
    }

    if (year !== undefined) {
      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid year",
        });
      }

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

    if (!mongoose.isValidObjectId(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID",
      });
    }

    if (typeof reason !== "string") {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason must be text",
      });
    }

    const trimmedReason = reason.trim();

    if (trimmedReason.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason cannot exceed 300 characters",
      });
    }

    /*
      employee condition prevents one employee from cancelling
      another employee's request.
    */
    const existingRequest = await LeaveRequest.findOne({
      _id: leaveRequestId,
      employee: req.user._id,
    }).populate("leaveType", "name code color isPaid");

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (existingRequest.status !== LEAVE_STATUSES.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Only pending leave requests can be cancelled",
      });
    }

    if (!existingRequest.leaveType) {
      const error = new Error("The leave type associated with this request no longer exists");

      error.statusCode = 500;
      throw error;
    }

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

    if (!cancelledRequest) {
      return res.status(409).json({
        success: false,
        message: "The request status changed before it could be cancelled",
      });
    }

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

        const error = new Error("Unable to restore the reserved leave balance");

        error.statusCode = 500;
        throw error;
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
    const { status = LEAVE_STATUSES.PENDING, department, leaveType, year, page = "1", limit = "10" } = req.query;

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

    const normalizedStatus = status.trim().toUpperCase();

    if (!LEAVE_STATUS_VALUES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${LEAVE_STATUS_VALUES.join(", ")}`,
      });
    }

    const filter = {
      status: normalizedStatus,
    };

    /*
      HR Managers can only see requests from departments
      where they are assigned as the manager.
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      const managedDepartments = await Department.find({
        manager: req.user._id,
        isActive: true,
      }).select("_id");

      if (managedDepartments.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned as the manager of any active department",
        });
      }

      filter.department = {
        $in: managedDepartments.map((managedDepartment) => managedDepartment._id),
      };
    }

    /*
      Admin can optionally filter by one department.
    */
    if (req.user.role === USER_ROLES.ADMIN && department) {
      if (!mongoose.isValidObjectId(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const selectedDepartment = await Department.findById(department);

      if (!selectedDepartment) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      filter.department = department;
    }

    if (leaveType) {
      if (!mongoose.isValidObjectId(leaveType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave type ID",
        });
      }

      filter.leaveType = leaveType;
    }

    if (year !== undefined) {
      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid year",
        });
      }

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
        status: normalizedStatus,
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

    if (!mongoose.isValidObjectId(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID",
      });
    }

    if (decision !== LEAVE_STATUSES.APPROVED && decision !== LEAVE_STATUSES.REJECTED) {
      return res.status(400).json({
        success: false,
        message: "Decision must be APPROVED or REJECTED",
      });
    }

    if (typeof remark !== "string") {
      return res.status(400).json({
        success: false,
        message: "Decision remark must be text",
      });
    }

    const trimmedRemark = remark.trim();

    if (decision === LEAVE_STATUSES.REJECTED && trimmedRemark.length < 5) {
      return res.status(400).json({
        success: false,
        message: "A rejection remark of at least 5 characters is required",
      });
    }

    if (trimmedRemark.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Decision remark cannot exceed 500 characters",
      });
    }

    const existingRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("leaveType", "name code color isPaid")
      .populate("department", "name code manager isActive");

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (existingRequest.status !== LEAVE_STATUSES.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Only pending leave requests can be approved or rejected",
      });
    }

    if (!existingRequest.leaveType) {
      const error = new Error("The leave type associated with this request no longer exists");

      error.statusCode = 500;
      throw error;
    }

    if (!existingRequest.department) {
      const error = new Error("The department associated with this request no longer exists");

      error.statusCode = 500;
      throw error;
    }

    /*
      HR Managers may only decide requests from departments
      assigned to them.
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      const managesDepartment = await Department.exists({
        _id: existingRequest.department._id,
        manager: req.user._id,
        isActive: true,
      });

      if (!managesDepartment) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to review requests from this department",
        });
      }
    }

    /*
      An HR Manager may also submit their own leave request,
      but they must not approve or reject it themselves.
    */
    if (existingRequest.employee.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve or reject your own leave request",
      });
    }

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

    if (!decidedRequest) {
      return res.status(409).json({
        success: false,
        message: "The request status changed before your decision could be saved",
      });
    }

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

        const error = new Error("Unable to update the employee leave balance");

        error.statusCode = 500;
        throw error;
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

    if (!mongoose.isValidObjectId(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID",
      });
    }

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

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const currentUserId = req.user._id.toString();

    const employeeId = leaveRequest.employee?._id?.toString();

    const isOwnRequest = employeeId === currentUserId;

    /*
      Employees may only view their own requests.
    */
    if (req.user.role === USER_ROLES.EMPLOYEE && !isOwnRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    /*
      HR Managers may view:
      1. Their own leave requests
      2. Requests from departments they manage
    */
    if (req.user.role === USER_ROLES.HR_MANAGER && !isOwnRequest) {
      const managesDepartment = await Department.exists({
        _id: leaveRequest.department._id,
        manager: req.user._id,
      });

      if (!managesDepartment) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }
    }

    return res.status(200).json({
      success: true,
      leaveRequest,
    });
  } catch (error) {
    next(error);
  }
}
