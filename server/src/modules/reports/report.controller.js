import mongoose from "mongoose";

import LeaveRequest from "../leaveRequests/leaveRequest.model.js";
import Department from "../departments/department.model.js";
import LeaveType from "../leaveTypes/leaveType.model.js";

import { USER_ROLES } from "../../constants/roles.js";

import { LEAVE_STATUSES, LEAVE_STATUS_VALUES } from "../../constants/leaveStatuses.js";
import { AppError } from "../../utils/AppError.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCurrentApplicationYear() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata",
    year: "numeric",
  });

  return Number(formatter.format(new Date()));
}

function createEmptyStatusBreakdown() {
  return Object.fromEntries(
    LEAVE_STATUS_VALUES.map((status) => [
      status,
      {
        requestCount: 0,
        workingDays: 0,
      },
    ]),
  );
}

function createEmptyMonthlyBreakdown() {
  return MONTH_NAMES.map((monthName, index) => ({
    month: index + 1,
    monthName,
    requestCount: 0,
    requestedDays: 0,
    approvedDays: 0,
    pendingDays: 0,
    rejectedDays: 0,
    cancelledDays: 0,
  }));
}

// Independent of department resolution below, so it can run in
// parallel with it instead of being awaited sequentially.
async function resolveLeaveTypeFilter(leaveTypeId) {
  if (!leaveTypeId) {
    return null;
  }
  if (!mongoose.isValidObjectId(leaveTypeId)) throw new AppError("Invalid leave type ID", 400, "INVALID_IDENTIFIER");
  const leaveType = await LeaveType.findById(leaveTypeId).select("name code isActive").lean();
  if (!leaveType) throw new AppError("Leave type not found", 404, "LEAVE_TYPE_NOT_FOUND");
  return leaveType;
}

// Encapsulates the role-specific department scoping so it can run
// concurrently with resolveLeaveTypeFilter above.
async function resolveDepartmentContext({ role, userId, departmentId }) {
  if (role === USER_ROLES.HR_MANAGER) {
    const managedDepartments = await Department.find({
      manager: userId,
      isActive: true,
    })
      .select("name code maximumConcurrentLeaves")
      .sort({ name: 1 })
      .lean();
    const managedDepartmentIds = managedDepartments.map((managedDepartment) => managedDepartment._id);
    if (departmentId) {
      if (!mongoose.isValidObjectId(departmentId)) throw new AppError("Invalid department ID", 400, "INVALID_IDENTIFIER");
      const managesSelectedDepartment = managedDepartmentIds.some(
        (managedDepartmentId) => managedDepartmentId.toString() === departmentId,
      );
      if (!managesSelectedDepartment) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      const selectedDepartment = managedDepartments.find(
        (managedDepartment) => managedDepartment._id.toString() === departmentId,
      );
      return {
        managedDepartments,
        selectedDepartment,
        filterValue: new mongoose.Types.ObjectId(departmentId),
      };
    }
    return {
      managedDepartments,
      selectedDepartment: null,
      filterValue: { $in: managedDepartmentIds },
    };
  }

  if (role === USER_ROLES.ADMIN && departmentId) {
    if (!mongoose.isValidObjectId(departmentId)) throw new AppError("Invalid department ID", 400, "INVALID_IDENTIFIER");
    const selectedDepartment = await Department.findById(departmentId)
      .select("name code isActive maximumConcurrentLeaves")
      .lean();
    if (!selectedDepartment) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    return {
      managedDepartments: [],
      selectedDepartment,
      filterValue: new mongoose.Types.ObjectId(departmentId),
    };
  }
  return {
    managedDepartments: [],
    selectedDepartment: null,
    filterValue: undefined,
  };
}

export async function getLeaveSummaryReport(req, res, next) {
  try {
    const { department, leaveType, status } = req.query;
    const year = Number(req.query.year ?? getCurrentApplicationYear());
    if (!Number.isInteger(year) || year < 2000 || year > 2100)
      throw new AppError("Please provide a valid report year", 400, "INVALID_YEAR");
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1));
    const filter = {
      startDate: {
        $gte: startOfYear,
        $lt: startOfNextYear,
      },
    };
    /*
      Validate the optional status filter (synchronous, no query
      needed, so it stays outside the Promise.all below).
    */
    if (status) {
      const normalizedStatus = String(status).trim().toUpperCase();
      if (!LEAVE_STATUS_VALUES.includes(normalizedStatus))
        throw new AppError(`Status must be one of: ${LEAVE_STATUS_VALUES.join(", ")}`, 400, "INVALID_STATUS_FILTER");

      filter.status = normalizedStatus;
    }
    /*
      The leave-type lookup and the role-specific department
      resolution don't depend on each other's results, so they run
      concurrently instead of one after another.
    */
    const [selectedLeaveType, departmentContext] = await Promise.all([
      resolveLeaveTypeFilter(leaveType),
      resolveDepartmentContext({
        role: req.user.role,
        userId: req.user._id,
        departmentId: department,
      }),
    ]);
    if (selectedLeaveType) {
      filter.leaveType = new mongoose.Types.ObjectId(leaveType);
    }
    if (departmentContext.filterValue !== undefined) {
      filter.department = departmentContext.filterValue;
    }
    const { selectedDepartment, managedDepartments } = departmentContext;
    const [overallRows, statusRows, leaveTypeRows, monthlyRows, departmentRows] = await Promise.all([
      /*
        Overall totals.
      */
      LeaveRequest.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            requestCount: {
              $sum: 1,
            },
            workingDays: {
              $sum: "$workingDays",
            },
          },
        },
      ]),

      /*
        Request count and working days by status.
      */
      LeaveRequest.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$status",
            requestCount: {
              $sum: 1,
            },
            workingDays: {
              $sum: "$workingDays",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      /*
        Usage grouped by leave type.
      */
      LeaveRequest.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$leaveType",
            requestCount: {
              $sum: 1,
            },
            requestedDays: {
              $sum: "$workingDays",
            },
            approvedDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.APPROVED],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
            pendingDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.PENDING],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "leavetypes",
            localField: "_id",
            foreignField: "_id",
            as: "leaveType",
          },
        },
        {
          $unwind: {
            path: "$leaveType",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            leaveType: {
              _id: "$_id",
              name: {
                $ifNull: ["$leaveType.name", "Deleted Leave Type"],
              },
              code: {
                $ifNull: ["$leaveType.code", "UNKNOWN"],
              },
              color: "$leaveType.color",
              isPaid: "$leaveType.isPaid",
              isActive: "$leaveType.isActive",
            },
            requestCount: 1,
            requestedDays: 1,
            approvedDays: 1,
            pendingDays: 1,
          },
        },
        {
          $sort: {
            "leaveType.name": 1,
          },
        },
      ]),

      /*
        Monthly request and working-day trend.
      */
      LeaveRequest.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: {
              $month: "$startDate",
            },
            requestCount: {
              $sum: 1,
            },
            requestedDays: {
              $sum: "$workingDays",
            },
            approvedDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.APPROVED],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
            pendingDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.PENDING],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
            rejectedDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.REJECTED],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
            cancelledDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.CANCELLED],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      /*
        Usage grouped by department.
      */
      LeaveRequest.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$department",
            requestCount: {
              $sum: 1,
            },
            requestedDays: {
              $sum: "$workingDays",
            },
            approvedDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.APPROVED],
                  },
                  "$workingDays",
                  0,
                ],
              },
            },
            pendingRequestCount: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", LEAVE_STATUSES.PENDING],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "department",
          },
        },
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,

            department: {
              _id: "$_id",
              name: {
                $ifNull: ["$department.name", "Deleted Department"],
              },
              code: {
                $ifNull: ["$department.code", "UNKNOWN"],
              },
              isActive: "$department.isActive",
            },
            requestCount: 1,
            requestedDays: 1,
            approvedDays: 1,
            pendingRequestCount: 1,
          },
        },
        {
          $sort: {
            "department.name": 1,
          },
        },
      ]),
    ]);
    const overall = overallRows[0] || {
      requestCount: 0,
      workingDays: 0,
    };
    const byStatus = createEmptyStatusBreakdown();
    for (const statusRow of statusRows) {
      if (Object.hasOwn(byStatus, statusRow._id)) {
        byStatus[statusRow._id] = {
          requestCount: statusRow.requestCount,
          workingDays: statusRow.workingDays,
        };
      }
    }
    const byMonth = createEmptyMonthlyBreakdown();
    for (const monthlyRow of monthlyRows) {
      const monthIndex = monthlyRow._id - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        byMonth[monthIndex] = {
          month: monthlyRow._id,
          monthName: MONTH_NAMES[monthIndex],
          requestCount: monthlyRow.requestCount,
          requestedDays: monthlyRow.requestedDays,
          approvedDays: monthlyRow.approvedDays,
          pendingDays: monthlyRow.pendingDays,
          rejectedDays: monthlyRow.rejectedDays,
          cancelledDays: monthlyRow.cancelledDays,
        };
      }
    }
    return res.status(200).json({
      success: true,
      generatedAt: new Date(),
      filters: {
        year,
        status: status ? String(status).trim().toUpperCase() : null,
        department: selectedDepartment || null,
        leaveType: selectedLeaveType || null,
        scope: req.user.role === USER_ROLES.ADMIN ? "ORGANIZATION" : "MANAGED_DEPARTMENTS",
      },
      summary: {
        totalRequests: overall.requestCount,
        totalRequestedWorkingDays: overall.workingDays,
        approvedRequests: byStatus[LEAVE_STATUSES.APPROVED].requestCount,
        approvedWorkingDays: byStatus[LEAVE_STATUSES.APPROVED].workingDays,
        pendingRequests: byStatus[LEAVE_STATUSES.PENDING].requestCount,
        pendingWorkingDays: byStatus[LEAVE_STATUSES.PENDING].workingDays,
        rejectedRequests: byStatus[LEAVE_STATUSES.REJECTED].requestCount,
        cancelledRequests: byStatus[LEAVE_STATUSES.CANCELLED].requestCount,
      },
      byStatus,
      byMonth,
      byLeaveType: leaveTypeRows,
      byDepartment: departmentRows,
      managedDepartments: req.user.role === USER_ROLES.HR_MANAGER ? managedDepartments : undefined,
    });
  } catch (error) {
    next(error);
  }
}
