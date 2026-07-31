import { formatInputDate, formatStatus } from "../../../utils/helper.js";

export function normalizeDashboardSummary(response) {
  const dashboard =
    response?.dashboard ||
    response?.data?.dashboard ||
    response?.summary ||
    response?.data?.summary ||
    response?.data ||
    response ||
    {};

  const leaveBalancesData = dashboard.leaveBalances || {};
  const balanceSummary = leaveBalancesData.summary || {};
  const rawBalances =
    leaveBalancesData.balances ||
    dashboard.balances ||
    dashboard.myBalances ||
    (Array.isArray(leaveBalancesData) ? leaveBalancesData : []) ||
    [];

  const leaveBalances = normalizeBalances(rawBalances);

  const leaveRequests = dashboard.leaveRequests || {};
  const byStatus =
    leaveRequests.byStatus || dashboard.counts || dashboard.requestCounts || {};

  const upcomingApprovedApplications = normalizeUpcomingApplications(
    leaveRequests.upcomingApproved ||
    dashboard.requests ||
    [],
  );

  const availableBalance =
    balanceSummary.available ??
    dashboard.availableBalance ??
    dashboard.totalAvailableBalance ??
    leaveBalances.reduce((total, balance) => total + balance.available, 0);

  return {
    availableBalance,
    entitled: balanceSummary.entitled ?? 0,
    carriedForward: balanceSummary.carriedForward ?? 0,
    adjustments: balanceSummary.adjustments ?? 0,
    used: balanceSummary.used ?? 0,
    pendingDays: balanceSummary.pending ?? 0,
    pendingRequests:
      byStatus.PENDING ??
      byStatus.pending ??
      dashboard.pendingRequests ??
      upcomingApprovedApplications.filter((item) => item.status === "Pending").length,
    approvedRequests:
      byStatus.APPROVED ??
      byStatus.approved ??
      dashboard.approvedRequests ??
      upcomingApprovedApplications.filter((item) => item.status === "Approved").length,
    rejectedRequests:
      byStatus.REJECTED ??
      byStatus.rejected ??
      dashboard.rejectedRequests ??
      upcomingApprovedApplications.filter((item) => item.status === "Rejected").length,
    cancelledRequests:
      byStatus.CANCELLED ??
      byStatus.cancelled ??
      dashboard.cancelledRequests ??
      upcomingApprovedApplications.filter((item) => item.status === "Cancelled").length,
    totalRequests:
      leaveRequests.total ?? dashboard.totalRequests ?? upcomingApprovedApplications.length,
    unreadNotificationCount: dashboard.unreadNotificationCount ?? 0,
    upcomingHolidays: normalizeHolidays(dashboard.upcomingHolidays),
    role: dashboard.role,
    year: dashboard.year,
    leaveBalances,
    upcomingApprovedApplications,
  };
}

export function normalizeBalances(rawBalances) {
  if (!Array.isArray(rawBalances)) return [];
  return rawBalances.map((balance) => {
    const leaveType = balance.leaveType;
    const total =
      balance.entitled ??
      balance.total ??
      balance.yearlyAllowance ??
      leaveType?.yearlyAllowance ??
      balance.allocated ??
      0;
    const used = balance.used ?? balance.usedDays ?? 0;
    const pending = balance.pending ?? balance.pendingDays ?? 0;
    const carriedForward = balance.carriedForward ?? 0;
    const adjustments = balance.adjustments ?? 0;
    const available =
      balance.available ??
      balance.availableDays ??
      balance.remaining ??
      balance.balance ??
      Math.max(total + carriedForward + adjustments - used - pending, 0);
    return {
      id: balance._id || balance.id || leaveType?._id || leaveType?.id,
      leaveTypeId: leaveType?._id || leaveType?.id,
      leaveTypeName:
        leaveType?.name || balance.leaveTypeName || balance.name || "Leave",
      leaveTypeCode: leaveType?.code,
      color: leaveType?.color,
      isPaid: leaveType?.isPaid,
      total,
      carriedForward,
      adjustments,
      used,
      pending,
      available,
    };
  });
}

export function normalizeUpcomingApplications(rawApplications) {
  if (!Array.isArray(rawApplications)) return [];
  return rawApplications.slice(0, 5).map((application) => {
    const leaveType = application.leaveType;
    return {
      id: application._id || application.id,
      leaveType:
        leaveType?.name ||
        application.leaveTypeName ||
        application.type ||
        "Leave",
      status: formatStatus(application.status),
      startDate: formatInputDate(application.startDate),
      endDate: formatInputDate(application.endDate),
      appliedOn: formatInputDate(
        application.submittedOn ||
        application.createdAt ||
        application.appliedOn,
      ),
      days:
        application.days ||
        application.workingDays ||
        application.totalDays ||
        application.numberOfDays ||
        0,
    };
  });
}

function normalizeHolidays(rawHolidays) {
  if (!Array.isArray(rawHolidays)) return [];
  return rawHolidays.map((holiday) => ({
    id: holiday._id || holiday.id,
    name: holiday.name,
    date: formatInputDate(holiday.date),
    type: holiday.type,
    description: holiday.description,
  }));
}
