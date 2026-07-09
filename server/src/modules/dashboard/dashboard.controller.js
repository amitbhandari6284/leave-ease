import LeaveRequest from "../leaveRequests/leaveRequest.model.js";
import LeaveBalance from "../leaveBalances/leaveBalance.model.js";
import LeaveType from "../leaveTypes/leaveType.model.js";
import Department from "../departments/department.model.js";
import Holiday from "../holidays/holiday.model.js";
import Notification from "../notifications/notification.model.js";
import User from "../users/user.model.js";

import { LEAVE_STATUSES, LEAVE_STATUS_VALUES } from "../../constants/leaveStatuses.js";

import { USER_ROLES, USER_ROLE_VALUES } from "../../constants/roles.js";

function getApplicationToday() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);

  const month = Number(parts.find((part) => part.type === "month")?.value);

  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

function getYearRange(year) {
  return {
    startOfYear: new Date(Date.UTC(year, 0, 1)),
    startOfNextYear: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

function normalizeGroupedCounts(rows, allowedValues) {
  const counts = Object.fromEntries(allowedValues.map((value) => [value, 0]));

  for (const row of rows) {
    if (Object.hasOwn(counts, row._id)) {
      counts[row._id] = row.count;
    }
  }

  return counts;
}

async function getLeaveStatusCounts(filter) {
  const groupedCounts = await LeaveRequest.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return normalizeGroupedCounts(groupedCounts, LEAVE_STATUS_VALUES);
}

async function getUserRoleCounts(filter = {}) {
  const groupedCounts = await User.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: "$role",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return normalizeGroupedCounts(groupedCounts, USER_ROLE_VALUES);
}

async function getUserBalanceSummary(userId, year) {
  const balances = await LeaveBalance.find({
    user: userId,
    year,
  }).populate("leaveType", ["name", "code", "color", "isPaid", "yearlyAllowance", "isActive"].join(" "));

  balances.sort((firstBalance, secondBalance) => {
    const firstName = firstBalance.leaveType?.name || "";

    const secondName = secondBalance.leaveType?.name || "";

    return firstName.localeCompare(secondName);
  });

  const summary = balances.reduce(
    (totals, balance) => {
      totals.entitled += balance.entitled;
      totals.carriedForward += balance.carriedForward;
      totals.adjustments += balance.adjustments;
      totals.used += balance.used;
      totals.pending += balance.pending;
      totals.available += balance.available;

      return totals;
    },
    {
      entitled: 0,
      carriedForward: 0,
      adjustments: 0,
      used: 0,
      pending: 0,
      available: 0,
    },
  );

  return {
    summary,
    balances,
  };
}

async function getUpcomingHolidays(today) {
  return Holiday.find({
    isActive: true,
    date: {
      $gte: today,
    },
  })
    .select("name date type description")
    .sort({
      date: 1,
    })
    .limit(5);
}

async function getEmployeeDashboard({ user, year, today, startOfYear, startOfNextYear }) {
  const [balanceData, requestCounts, upcomingLeave, unreadNotificationCount, upcomingHolidays] = await Promise.all([
    getUserBalanceSummary(user._id, year),

    getLeaveStatusCounts({
      employee: user._id,

      startDate: {
        $gte: startOfYear,
        $lt: startOfNextYear,
      },
    }),

    LeaveRequest.find({
      employee: user._id,
      status: LEAVE_STATUSES.APPROVED,

      endDate: {
        $gte: today,
      },
    })
      .populate("leaveType", "name code color isPaid")
      .sort({
        startDate: 1,
      })
      .limit(5),

    Notification.countDocuments({
      recipient: user._id,
      isRead: false,
    }),

    getUpcomingHolidays(today),
  ]);

  return {
    role: USER_ROLES.EMPLOYEE,
    year,

    leaveBalances: balanceData,

    leaveRequests: {
      total: Object.values(requestCounts).reduce((total, count) => total + count, 0),
      byStatus: requestCounts,
      upcomingApproved: upcomingLeave,
    },

    unreadNotificationCount,
    upcomingHolidays,
  };
}

async function getHrDashboard({ user, year, today, startOfYear, startOfNextYear }) {
  const managedDepartments = await Department.find({
    manager: user._id,
    isActive: true,
  })
    .select("name code maximumConcurrentLeaves isActive")
    .sort({
      name: 1,
    });

  const departmentIds = managedDepartments.map((department) => department._id);

  const teamFilter = {
    department: {
      $in: departmentIds,
    },
  };

  const requestFilter = {
    department: {
      $in: departmentIds,
    },

    startDate: {
      $gte: startOfYear,
      $lt: startOfNextYear,
    },
  };

  const [
    activeEmployeeCount,
    pendingReviewCount,
    employeesOnLeaveToday,
    requestCounts,
    upcomingTeamLeave,
    ownBalanceData,
    unreadNotificationCount,
    upcomingHolidays,
  ] = await Promise.all([
    User.countDocuments({
      ...teamFilter,
      role: USER_ROLES.EMPLOYEE,
      isActive: true,
    }),

    LeaveRequest.countDocuments({
      department: {
        $in: departmentIds,
      },
      status: LEAVE_STATUSES.PENDING,
    }),

    LeaveRequest.countDocuments({
      department: {
        $in: departmentIds,
      },

      status: LEAVE_STATUSES.APPROVED,

      startDate: {
        $lte: today,
      },

      endDate: {
        $gte: today,
      },
    }),

    getLeaveStatusCounts(requestFilter),

    LeaveRequest.find({
      department: {
        $in: departmentIds,
      },

      status: LEAVE_STATUSES.APPROVED,

      endDate: {
        $gte: today,
      },
    })
      .populate("employee", "name employeeId designation avatarUrl")
      .populate("department", "name code")
      .populate("leaveType", "name code color")
      .sort({
        startDate: 1,
      })
      .limit(10),

    getUserBalanceSummary(user._id, year),

    Notification.countDocuments({
      recipient: user._id,
      isRead: false,
    }),

    getUpcomingHolidays(today),
  ]);

  return {
    role: USER_ROLES.HR_MANAGER,
    year,

    managedDepartments: {
      count: managedDepartments.length,
      departments: managedDepartments,
    },

    team: {
      activeEmployeeCount,
      employeesOnLeaveToday,
    },

    reviewQueue: {
      pendingReviewCount,
      requestCounts,
    },

    upcomingTeamLeave,

    ownLeaveBalances: ownBalanceData,

    unreadNotificationCount,
    upcomingHolidays,
  };
}

async function getAdminDashboard({ user, year, today, startOfYear, startOfNextYear }) {
  const [
    totalActiveUsers,
    activeUserRoleCounts,
    activeDepartmentCount,
    activeLeaveTypeCount,
    pendingRequestCount,
    employeesOnLeaveToday,
    requestCounts,
    upcomingOrganizationLeave,
    unreadNotificationCount,
    upcomingHolidays,
  ] = await Promise.all([
    User.countDocuments({
      isActive: true,
    }),

    getUserRoleCounts({
      isActive: true,
    }),

    Department.countDocuments({
      isActive: true,
    }),

    LeaveType.countDocuments({
      isActive: true,
    }),

    LeaveRequest.countDocuments({
      status: LEAVE_STATUSES.PENDING,
    }),

    LeaveRequest.countDocuments({
      status: LEAVE_STATUSES.APPROVED,

      startDate: {
        $lte: today,
      },

      endDate: {
        $gte: today,
      },
    }),

    getLeaveStatusCounts({
      startDate: {
        $gte: startOfYear,
        $lt: startOfNextYear,
      },
    }),

    LeaveRequest.find({
      status: LEAVE_STATUSES.APPROVED,

      endDate: {
        $gte: today,
      },
    })
      .populate("employee", "name employeeId designation avatarUrl")
      .populate("department", "name code")
      .populate("leaveType", "name code color")
      .sort({
        startDate: 1,
      })
      .limit(10),

    Notification.countDocuments({
      recipient: user._id,
      isRead: false,
    }),

    getUpcomingHolidays(today),
  ]);

  return {
    role: USER_ROLES.ADMIN,
    year,

    organization: {
      totalActiveUsers,
      activeUsersByRole: activeUserRoleCounts,
      activeDepartmentCount,
      activeLeaveTypeCount,
      employeesOnLeaveToday,
    },

    leaveRequests: {
      pendingRequestCount,
      total: Object.values(requestCounts).reduce((total, count) => total + count, 0),
      byStatus: requestCounts,
    },

    upcomingOrganizationLeave,
    unreadNotificationCount,
    upcomingHolidays,
  };
}

export async function getDashboardSummary(req, res, next) {
  try {
    const today = getApplicationToday();

    const requestedYear = req.query.year ?? today.getUTCFullYear();

    const year = Number(requestedYear);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid dashboard year",
      });
    }

    const { startOfYear, startOfNextYear } = getYearRange(year);

    const dashboardArguments = {
      user: req.user,
      year,
      today,
      startOfYear,
      startOfNextYear,
    };

    let dashboard;

    if (req.user.role === USER_ROLES.EMPLOYEE) {
      dashboard = await getEmployeeDashboard(dashboardArguments);
    } else if (req.user.role === USER_ROLES.HR_MANAGER) {
      dashboard = await getHrDashboard(dashboardArguments);
    } else if (req.user.role === USER_ROLES.ADMIN) {
      dashboard = await getAdminDashboard(dashboardArguments);
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access a dashboard",
      });
    }

    return res.status(200).json({
      success: true,
      generatedAt: new Date(),
      today,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
}
