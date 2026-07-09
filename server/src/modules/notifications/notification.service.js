import Notification from "./notification.model.js";

import User from "../users/user.model.js";
import Department from "../departments/department.model.js";

import { USER_ROLES } from "../../constants/roles.js";
import { NOTIFICATION_TYPES } from "../../constants/notificationTypes.js";

import { formatDateOnly } from "../../utils/dateOnly.js";

export async function createNotification({
  recipient,
  type,
  title,
  message,
  relatedLeaveRequest = null,
  relatedUser = null,
  relatedLeaveBalance = null,
  metadata = {},
}) {
  return Notification.create({
    recipient,
    type,
    title,
    message,
    relatedLeaveRequest,
    relatedUser,
    relatedLeaveBalance,
    metadata,
  });
}

export async function createManyNotifications(notifications) {
  if (!Array.isArray(notifications)) {
    throw new TypeError("Notifications must be provided as an array");
  }

  if (notifications.length === 0) {
    return [];
  }

  return Notification.insertMany(notifications);
}

/*
  Notification creation should not cause a successful business
  action—such as leave approval—to fail.

  The error is logged, but the original action still succeeds.
*/
export async function runNotificationTask(taskName, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`Notification task failed: ${taskName}`, error);

    return null;
  }
}

function getDocumentId(value) {
  if (!value) {
    return null;
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function getUniqueRecipients(recipientValues, excludedValues = []) {
  const excludedIds = new Set(excludedValues.map(getDocumentId).filter(Boolean));

  return [
    ...new Set(
      recipientValues
        .map(getDocumentId)
        .filter(Boolean)
        .filter((recipientId) => !excludedIds.has(recipientId)),
    ),
  ];
}

async function getActiveAdminIds() {
  const administrators = await User.find({
    role: USER_ROLES.ADMIN,
    isActive: true,
  })
    .select("_id")
    .lean();

  return administrators.map((administrator) => administrator._id);
}

async function getLeaveEmployee(leaveRequest) {
  const employeeId = getDocumentId(leaveRequest.employee);

  if (leaveRequest.employee && leaveRequest.employee.name) {
    return {
      _id: employeeId,
      name: leaveRequest.employee.name,
      employeeId: leaveRequest.employee.employeeId || "",
    };
  }

  const employee = await User.findById(employeeId).select("name employeeId").lean();

  return employee
    ? {
        _id: employee._id.toString(),
        name: employee.name,
        employeeId: employee.employeeId,
      }
    : {
        _id: employeeId,
        name: "An employee",
        employeeId: "",
      };
}

function getLeaveTypeName(leaveRequest) {
  return leaveRequest.leaveType?.name || "leave";
}

function getLeaveDateRange(leaveRequest) {
  return {
    startDate: formatDateOnly(leaveRequest.startDate),
    endDate: formatDateOnly(leaveRequest.endDate),
  };
}

export async function notifyLeaveSubmitted({ leaveRequest }) {
  const employee = await getLeaveEmployee(leaveRequest);

  const departmentId = getDocumentId(leaveRequest.department);

  const [department, administratorIds] = await Promise.all([
    Department.findById(departmentId).select("name manager").lean(),

    getActiveAdminIds(),
  ]);

  const recipients = getUniqueRecipients([department?.manager, ...administratorIds], [employee._id]);

  if (recipients.length === 0) {
    return [];
  }

  const leaveTypeName = getLeaveTypeName(leaveRequest);

  const { startDate, endDate } = getLeaveDateRange(leaveRequest);

  return createManyNotifications(
    recipients.map((recipient) => ({
      recipient,
      type: NOTIFICATION_TYPES.LEAVE_SUBMITTED,
      title: "New leave request",
      message: `${employee.name} submitted a ${leaveTypeName} request from ${startDate} to ${endDate} for ${leaveRequest.workingDays} working day(s).`,
      relatedLeaveRequest: leaveRequest._id,
      relatedUser: employee._id,

      metadata: {
        status: leaveRequest.status,
        departmentId,
        startDate,
        endDate,
        workingDays: leaveRequest.workingDays,
      },
    })),
  );
}

export async function notifyLeaveDecision({ leaveRequest }) {
  const employee = await getLeaveEmployee(leaveRequest);

  if (!employee._id) {
    return null;
  }

  const wasApproved = leaveRequest.status === "APPROVED";

  const leaveTypeName = getLeaveTypeName(leaveRequest);

  const { startDate, endDate } = getLeaveDateRange(leaveRequest);

  return createNotification({
    recipient: employee._id,

    type: wasApproved ? NOTIFICATION_TYPES.LEAVE_APPROVED : NOTIFICATION_TYPES.LEAVE_REJECTED,

    title: wasApproved ? "Leave request approved" : "Leave request rejected",

    message: wasApproved
      ? `Your ${leaveTypeName} request from ${startDate} to ${endDate} has been approved.`
      : `Your ${leaveTypeName} request from ${startDate} to ${endDate} has been rejected.`,

    relatedLeaveRequest: leaveRequest._id,

    relatedUser: employee._id,

    metadata: {
      status: leaveRequest.status,
      startDate,
      endDate,
      workingDays: leaveRequest.workingDays,
      decisionRemark: leaveRequest.decisionRemark || "",
    },
  });
}

export async function notifyLeaveCancelled({ leaveRequest }) {
  const employee = await getLeaveEmployee(leaveRequest);

  const departmentId = getDocumentId(leaveRequest.department);

  const [department, administratorIds] = await Promise.all([
    Department.findById(departmentId).select("name manager").lean(),

    getActiveAdminIds(),
  ]);

  const recipients = getUniqueRecipients([department?.manager, ...administratorIds], [employee._id]);

  if (recipients.length === 0) {
    return [];
  }

  const leaveTypeName = getLeaveTypeName(leaveRequest);

  const { startDate, endDate } = getLeaveDateRange(leaveRequest);

  return createManyNotifications(
    recipients.map((recipient) => ({
      recipient,
      type: NOTIFICATION_TYPES.LEAVE_CANCELLED,
      title: "Leave request cancelled",
      message: `${employee.name} cancelled their ${leaveTypeName} request from ${startDate} to ${endDate}.`,
      relatedLeaveRequest: leaveRequest._id,
      relatedUser: employee._id,

      metadata: {
        status: leaveRequest.status,
        departmentId,
        startDate,
        endDate,
        workingDays: leaveRequest.workingDays,
        cancellationReason: leaveRequest.cancellationReason || "",
      },
    })),
  );
}

export async function notifyBalanceAdjusted({ targetUser, leaveBalance, amount, reason, adjustedBy }) {
  const targetUserId = getDocumentId(targetUser);

  if (!targetUserId) {
    return null;
  }

  const leaveTypeName = leaveBalance.leaveType?.name || "leave";

  const direction = amount > 0 ? "increased" : "decreased";

  return createNotification({
    recipient: targetUserId,
    type: NOTIFICATION_TYPES.BALANCE_ADJUSTED,
    title: "Leave balance updated",
    message: `Your ${leaveTypeName} balance for ${leaveBalance.year} was ${direction} by ${Math.abs(amount)} day(s).`,
    relatedUser: targetUserId,
    relatedLeaveBalance: leaveBalance._id,

    metadata: {
      amount,
      reason,
      year: leaveBalance.year,
      leaveTypeId: getDocumentId(leaveBalance.leaveType),
      adjustedBy: getDocumentId(adjustedBy),
      newAvailable: leaveBalance.available,
    },
  });
}
