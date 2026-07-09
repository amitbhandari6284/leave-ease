import mongoose from "mongoose";

import Department from "../departments/department.model.js";
import LeaveRequest from "../leaveRequests/leaveRequest.model.js";
import Holiday from "../holidays/holiday.model.js";

import { USER_ROLES } from "../../constants/roles.js";
import { LEAVE_STATUSES } from "../../constants/leaveStatuses.js";
import { formatDateOnly } from "../../utils/dateOnly.js";

function getCurrentApplicationYearMonth() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  });

  const dateParts = formatter.formatToParts(new Date());

  const year = Number(dateParts.find((part) => part.type === "year")?.value);

  const month = Number(dateParts.find((part) => part.type === "month")?.value);

  return {
    year,
    month,
  };
}

function isWorkingDate(date, holidayDateKeys) {
  const dayOfWeek = date.getUTCDay();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const isHoliday = holidayDateKeys.has(formatDateOnly(date));

  return !isWeekend && !isHoliday;
}

export async function getDepartmentLeaveCalendar(req, res, next) {
  try {
    const { departmentId } = req.params;

    if (!mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const currentDate = getCurrentApplicationYearMonth();

    const year = req.query.year === undefined ? currentDate.year : Number(req.query.year);

    const month = req.query.month === undefined ? currentDate.month : Number(req.query.month);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid calendar year",
      });
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Calendar month must be between 1 and 12",
      });
    }

    const department = await Department.findById(departmentId).select(
      ["name", "code", "manager", "maximumConcurrentLeaves", "isActive"].join(" "),
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const currentUserDepartmentId = req.user.department?.toString();

    const isOwnDepartment = currentUserDepartmentId === department._id.toString();

    /*
      Employees may only see their own department.
    */
    if (req.user.role === USER_ROLES.EMPLOYEE && !isOwnDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    /*
      HR Managers may see:
      1. Their own department
      2. Departments assigned to them as manager
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      const isDepartmentManager = department.manager?.toString() === req.user._id.toString();

      if (!isOwnDepartment && !isDepartmentManager) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    /*
      Inactive departments are visible only to Admin.
    */
    if (!department.isActive && req.user.role !== USER_ROLES.ADMIN) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1));

    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    /*
      An event overlaps the month when:

      event.startDate < next month
      AND
      event.endDate >= this month
    */
    const [leaveRequests, holidays] = await Promise.all([
      LeaveRequest.find({
        department: department._id,
        status: LEAVE_STATUSES.APPROVED,

        startDate: {
          $lt: nextMonthStart,
        },

        endDate: {
          $gte: monthStart,
        },
      })
        .populate("employee", ["name", "employeeId", "designation", "avatarUrl"].join(" "))
        .populate("leaveType", "name code color isPaid")
        .sort({
          startDate: 1,
        })
        .lean(),

      Holiday.find({
        isActive: true,

        date: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
      })
        .select("name date type description")
        .sort({
          date: 1,
        })
        .lean(),
    ]);

    const holidayDateKeys = new Set(holidays.map((holiday) => formatDateOnly(holiday.date)));

    const dailyApprovedCounts = {};

    for (const leaveRequest of leaveRequests) {
      /*
        Clamp the leave range to the requested calendar month.
      */
      const rangeStart = new Date(Math.max(leaveRequest.startDate.getTime(), monthStart.getTime()));

      const lastDateOfMonth = new Date(nextMonthStart.getTime() - 24 * 60 * 60 * 1000);

      const rangeEnd = new Date(Math.min(leaveRequest.endDate.getTime(), lastDateOfMonth.getTime()));

      const currentDay = new Date(rangeStart);

      while (currentDay <= rangeEnd) {
        if (isWorkingDate(currentDay, holidayDateKeys)) {
          const dateKey = formatDateOnly(currentDay);

          dailyApprovedCounts[dateKey] = (dailyApprovedCounts[dateKey] || 0) + 1;
        }

        currentDay.setUTCDate(currentDay.getUTCDate() + 1);
      }
    }

    const maximumConcurrentLeaves = department.maximumConcurrentLeaves;

    const overCapacityDates = Object.entries(dailyApprovedCounts)
      .filter(([, approvedCount]) => approvedCount > maximumConcurrentLeaves)
      .map(([date, approvedCount]) => ({
        date,
        approvedCount,
        maximumConcurrentLeaves,
      }));

    /*
      Return only calendar-safe fields.

      Do not expose:
      - reason
      - attachmentUrl
      - decisionRemark
      - cancellationReason
    */
    const events = leaveRequests.map((leaveRequest) => ({
      _id: leaveRequest._id,
      employee: leaveRequest.employee,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      workingDays: leaveRequest.workingDays,
      status: leaveRequest.status,
    }));

    await department.populate({
      path: "manager",
      select: "name employeeId designation role",
    });

    return res.status(200).json({
      success: true,

      calendar: {
        year,
        month,
        monthStart,
        nextMonthStart,
      },

      department,

      capacity: {
        maximumConcurrentLeaves,
        dailyApprovedCounts,
        overCapacityDates,
      },

      leaveEventCount: events.length,
      events,

      holidayCount: holidays.length,
      holidays,
    });
  } catch (error) {
    next(error);
  }
}
