import { formatInputDate, formatStatus } from "../../../utils/helper.js";

export function normalizeReviewQueueResponse(response) {
  const rawRequests = response?.leaveRequests;
  return Array.isArray(rawRequests) ? rawRequests.map(normalizeRequest) : [];
}

function normalizeRequest(request) {
  const employee = request.employee || {};

  return {
    id: request._id || request.id,
    employee: employee.name || "Employee",
    initials: getInitials(employee.name),
    designation: employee.designation || "Employee",
    department: request.department?.name || "Department",
    leaveType: request.leaveType?.name || "Leave",
    submittedOn: formatInputDate(request.submittedAt),
    startDate: formatInputDate(request.startDate),
    endDate: formatInputDate(request.endDate),
    days: request.workingDays || 0,
    reason: request.reason || "No reason provided.",
    hasDocument: Boolean(request.attachmentUrl),
    conflicts: [],
    status: formatStatus(request.status),
    decidedBy: request.decidedBy?.name || "",
    decidedOn: formatInputDate(request.decidedAt),
    decisionRemarks: request.decisionRemark || "",
    raw: request,
  };
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
