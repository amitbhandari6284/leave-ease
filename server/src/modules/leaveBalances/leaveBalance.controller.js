import mongoose from "mongoose";

import LeaveBalance from "./leaveBalance.model.js";
import LeaveBalanceAdjustment from "./leaveBalanceAdjustment.model.js";
import User from "../users/user.model.js";
import Department from "../departments/department.model.js";

import { notifyBalanceAdjusted, runNotificationTask } from "../notifications/notification.service.js";
import { createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";
import { USER_ROLES } from "../../constants/roles.js";

function getCurrentApplicationYear() {
  const formattedYear = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());

  return Number(formattedYear);
}

export async function getMyLeaveBalances(req, res, next) {
  try {
    const requestedYear = req.query.year;
    const year = requestedYear ? Number(requestedYear) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid balance year",
      });
    }

    const balances = await LeaveBalance.find({
      user: req.user._id,
      year,
    }).populate(
      "leaveType",
      ["name", "code", "description", "color", "yearlyAllowance", "isPaid", "allowHalfDay", "isActive"].join(" "),
    );

    balances.sort((firstBalance, secondBalance) => firstBalance.leaveType.name.localeCompare(secondBalance.leaveType.name));

    return res.status(200).json({
      success: true,
      year,
      count: balances.length,
      balances,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserLeaveBalances(req, res, next) {
  try {
    const { userId } = req.params;

    const requestedYear = req.query.year ?? getCurrentApplicationYear();

    const year = Number(requestedYear);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid balance year",
      });
    }

    const targetUser = await User.findById(userId).select(
      ["name", "email", "employeeId", "role", "department", "manager", "designation", "avatarUrl", "isActive"].join(" "),
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (targetUser.role === USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: "Administrator accounts do not have leave balances",
      });
    }

    /*
      HR Managers can view:
      1. Their own balance
      2. Users from departments they manage
    */
    if (req.user.role === USER_ROLES.HR_MANAGER) {
      const isOwnBalance = targetUser._id.toString() === req.user._id.toString();

      if (!isOwnBalance) {
        if (!targetUser.department) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const managesDepartment = await Department.exists({
          _id: targetUser.department,
          manager: req.user._id,
          isActive: true,
        });

        if (!managesDepartment) {
          /*
            Return 404 rather than revealing that a user outside
            the HR Manager's scope exists.
          */
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
      }
    }

    const balances = await LeaveBalance.find({
      user: targetUser._id,
      year,
    }).populate(
      "leaveType",
      ["name", "code", "description", "color", "yearlyAllowance", "isPaid", "allowHalfDay", "isActive"].join(" "),
    );

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

    await targetUser.populate([
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
      year,
      user: targetUser,
      count: balances.length,
      summary,
      balances,
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustUserLeaveBalance(req, res, next) {
  let updatedBalance = null;
  let appliedAmount = null;

  try {
    const { userId } = req.params;

    const { leaveType: leaveTypeId, year = getCurrentApplicationYear(), amount, reason } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!mongoose.isValidObjectId(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID",
      });
    }

    const parsedYear = Number(year);

    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid balance year",
      });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return res.status(400).json({
        success: false,
        message: "Adjustment amount must be a number",
      });
    }

    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: "Adjustment amount cannot be zero",
      });
    }

    /*
      Allow complete days and half days:
      1, 2, -1, 0.5, -1.5
    */
    if (!Number.isInteger(amount * 2)) {
      return res.status(400).json({
        success: false,
        message: "Adjustment amount must use whole-day or half-day increments",
      });
    }

    if (Math.abs(amount) > 365) {
      return res.status(400).json({
        success: false,
        message: "Adjustment amount cannot exceed 365 days",
      });
    }

    if (typeof reason !== "string" || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Adjustment reason must contain at least 10 characters",
      });
    }

    const trimmedReason = reason.trim();

    if (trimmedReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Adjustment reason cannot exceed 500 characters",
      });
    }

    const targetUser = await User.findById(userId).select("name email employeeId role department designation isActive");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (targetUser.role === USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: "Administrator accounts do not have leave balances",
      });
    }

    if (req.user.role === USER_ROLES.HR_MANAGER) {
      // HR Managers cannot adjust their own balances.
      if (targetUser._id.toString() === req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "HR Managers cannot adjust their own leave balance",
        });
      }

      /*
    For the MVP, HR Managers may adjust only Employee
    balances—not other HR Manager balances.
  */
      if (targetUser.role !== USER_ROLES.EMPLOYEE) {
        return res.status(403).json({
          success: false,
          message: "HR Managers can adjust only employee leave balances",
        });
      }

      if (!targetUser.department) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      /*
    Confirm that the HR Manager manages the employee's
    active department.
  */
      const managesDepartment = await Department.exists({
        _id: targetUser.department,
        manager: req.user._id,
        isActive: true,
      });

      if (!managesDepartment) {
        /*
      Use 404 so HR Managers cannot confirm the existence
      of employees outside their permitted scope.
    */
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    }

    /*
      This update is atomic.

      For negative adjustments, MongoDB checks that the resulting
      available balance will not become negative.
    */
    updatedBalance = await LeaveBalance.findOneAndUpdate(
      {
        user: targetUser._id,
        leaveType: leaveTypeId,
        year: parsedYear,

        $expr: {
          $gte: [
            {
              $subtract: [
                {
                  $add: ["$entitled", "$carriedForward", "$adjustments", amount],
                },
                {
                  $add: ["$used", "$pending"],
                },
              ],
            },
            0,
          ],
        },
      },
      {
        $inc: {
          adjustments: amount,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedBalance) {
      const existingBalance = await LeaveBalance.findOne({
        user: targetUser._id,
        leaveType: leaveTypeId,
        year: parsedYear,
      });

      if (!existingBalance) {
        return res.status(404).json({
          success: false,
          message: "No leave balance exists for this user, leave type and year",
        });
      }

      return res.status(400).json({
        success: false,
        message: "This deduction would make the available balance negative",
      });
    }

    appliedAmount = amount;

    const previousAdjustmentTotal = updatedBalance.adjustments - amount;

    const newAdjustmentTotal = updatedBalance.adjustments;

    const newAvailable = updatedBalance.available;

    const previousAvailable = newAvailable - amount;

    let adjustmentRecord;

    try {
      adjustmentRecord = await LeaveBalanceAdjustment.create({
        user: targetUser._id,
        leaveBalance: updatedBalance._id,
        leaveType: updatedBalance.leaveType,
        year: parsedYear,
        amount,
        reason: trimmedReason,
        adjustedBy: req.user._id,
        previousAdjustmentTotal,
        newAdjustmentTotal,
        previousAvailable,
        newAvailable,
      });
    } catch (error) {
      /*
        Undo the balance change if its history record cannot
        be created.
      */
      await LeaveBalance.updateOne(
        {
          _id: updatedBalance._id,
        },
        {
          $inc: {
            adjustments: -amount,
          },
        },
      );

      updatedBalance = null;
      appliedAmount = null;

      throw error;
    }

    await updatedBalance.populate("leaveType", ["name", "code", "color", "yearlyAllowance", "isPaid", "isActive"].join(" "));

    await adjustmentRecord.populate([
      {
        path: "adjustedBy",
        select: "name email employeeId role designation",
      },
      {
        path: "leaveType",
        select: "name code color",
      },
    ]);

    await runNotificationTask("balance-adjusted", () =>
      notifyBalanceAdjusted({
        targetUser,
        leaveBalance: updatedBalance,
        amount,
        reason: trimmedReason,
        adjustedBy: req.user,
      }),
    );

    await runAuditTask("leave-balance-adjusted", () =>
      createAuditLog({
        actor: req.user,
        action: AUDIT_ACTIONS.LEAVE_BALANCE_ADJUSTED,
        entityType: AUDIT_ENTITY_TYPES.LEAVE_BALANCE,
        entityId: updatedBalance._id,
        description: amount > 0 ? "Leave balance was increased." : "Leave balance was decreased.",

        changes: {
          adjustments: {
            from: adjustmentRecord.previousAdjustmentTotal,
            to: adjustmentRecord.newAdjustmentTotal,
          },

          available: {
            from: adjustmentRecord.previousAvailable,
            to: adjustmentRecord.newAvailable,
          },
        },

        metadata: {
          targetUserId: targetUser._id.toString(),
          leaveTypeId:
            adjustmentRecord.leaveType?._id?.toString() ||
            updatedBalance.leaveType?._id?.toString() ||
            updatedBalance.leaveType.toString(),
          year: updatedBalance.year,
          amount,
          adjustmentRecordId: adjustmentRecord._id.toString(),
        },

        request: req,
      }),
    );

    return res.status(200).json({
      success: true,
      message: amount > 0 ? "Leave balance increased successfully" : "Leave balance decreased successfully",
      user: targetUser,
      leaveBalance: updatedBalance,
      adjustment: adjustmentRecord,
    });
  } catch (error) {
    /*
      This fallback is only relevant if an unexpected error
      happens after the balance update but before the adjustment
      record is safely created.
    */
    if (updatedBalance && appliedAmount !== null) {
      const adjustmentExists = await LeaveBalanceAdjustment.exists({
        leaveBalance: updatedBalance._id,
        adjustedBy: req.user._id,
        amount: appliedAmount,
        newAdjustmentTotal: updatedBalance.adjustments,
      });

      if (!adjustmentExists) {
        await LeaveBalance.updateOne(
          {
            _id: updatedBalance._id,
          },
          {
            $inc: {
              adjustments: -appliedAmount,
            },
          },
        );
      }
    }

    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors).map((validationError) => validationError.message);

      return res.status(400).json({
        success: false,
        message: validationMessages[0],
        errors: validationMessages,
      });
    }

    next(error);
  }
}
