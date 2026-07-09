import mongoose from "mongoose";

import LeaveRequest from "../leaveRequests/leaveRequest.model.js";
import Department from "../departments/department.model.js";
import LeaveType from "../leaveTypes/leaveType.model.js";

import { USER_ROLES } from "../../constants/roles.js";

import { LEAVE_STATUSES, LEAVE_STATUS_VALUES } from "../../constants/leaveStatuses.js";

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

export async function getLeaveSummaryReport(req, res, next) {
  try {
    const { department, leaveType, status } = req.query;

    const year = Number(req.query.year ?? getCurrentApplicationYear());

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid report year",
      });
    }

    const startOfYear = new Date(Date.UTC(year, 0, 1));

    const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1));

    const filter = {
      startDate: {
        $gte: startOfYear,
        $lt: startOfNextYear,
      },
    };

    let selectedDepartment = null;
    let selectedLeaveType = null;
    let managedDepartments = [];

    /*
      Validate the optional status filter.
    */
    if (status) {
      const normalizedStatus = String(status).trim().toUpperCase();

      if (!LEAVE_STATUS_VALUES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${LEAVE_STATUS_VALUES.join(", ")}`,
        });
      }

      filter.status = normalizedStatus;
    }

    /*
      Validate the optional leave-type filter.
    */
    if (leaveType) {
      if (!mongoose.isValidObjectId(leaveType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave type ID",
        });
      }

      selectedLeaveType = await LeaveType.findById(leaveType).select("name code isActive");

      if (!selectedLeaveType) {
        return res.status(404).json({
          success: false,
          message: "Leave type not found",
        });
      }

      filter.leaveType = new mongoose.Types.ObjectId(leaveType);
    }

    /*
      HR Managers are automatically restricted to departments
      assigned to them.
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      managedDepartments = await Department.find({
        manager: req.user._id,
        isActive: true,
      })
        .select("name code maximumConcurrentLeaves")
        .sort({
          name: 1,
        });

      const managedDepartmentIds = managedDepartments.map((managedDepartment) => managedDepartment._id);

      if (department) {
        if (!mongoose.isValidObjectId(department)) {
          return res.status(400).json({
            success: false,
            message: "Invalid department ID",
          });
        }

        const managesSelectedDepartment = managedDepartmentIds.some(
          (managedDepartmentId) => managedDepartmentId.toString() === department,
        );

        if (!managesSelectedDepartment) {
          return res.status(404).json({
            success: false,
            message: "Department not found",
          });
        }

        selectedDepartment = managedDepartments.find((managedDepartment) => managedDepartment._id.toString() === department);

        filter.department = new mongoose.Types.ObjectId(department);
      } else {
        /*
          An empty $in array safely produces an empty report for
          an HR Manager with no assigned departments.
        */
        filter.department = {
          $in: managedDepartmentIds,
        };
      }
    }

    /*
      Administrators may optionally filter by one department.
    */
    if (req.user.role === USER_ROLES.ADMIN && department) {
      if (!mongoose.isValidObjectId(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      selectedDepartment = await Department.findById(department).select("name code isActive maximumConcurrentLeaves");

      if (!selectedDepartment) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      filter.department = new mongoose.Types.ObjectId(department);
    }

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
