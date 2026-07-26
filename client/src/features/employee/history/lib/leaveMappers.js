import { formatInputDate, formatStatus } from "../../../../lib/helper.js";

export function normalizeLeaveRequestsResponse(response) {
  const rawRequests =
    response?.leaveRequests ||
    response?.requests ||
    response?.data?.leaveRequests ||
    response?.data?.requests ||
    response?.data ||
    [];

  if (!Array.isArray(rawRequests)) return [];

  return rawRequests.map(normalizeLeaveRequest);
}

function normalizeLeaveRequest(request) {
  const leaveType = request.leaveType || request.leaveTypeId;

  return {
    id: request._id || request.id,
    type: leaveType?.name || leaveType?.typeName || leaveType?.code || request.leaveTypeName || "Leave",
    status: formatStatus(request.status),
    startDate: formatInputDate(request.startDate),
    endDate: formatInputDate(request.endDate),
    appliedOn: formatInputDate(request.submittedOn || request.appliedAt || request.createdAt || request.appliedOn),
    days: request.days || request.workingDays || request.totalDays || request.numberOfDays || 0,
    reason: request.reason || "No reason provided.",
    remarks: request.decisionRemarks || request.remark || request.remarks || request.rejectionReason || "",
    documentUrl: request.documentUrl || request.attachmentUrl || request.document?.url || "",
    raw: request,
  };
}
