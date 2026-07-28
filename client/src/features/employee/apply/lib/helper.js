
export function normalizeLeaveTypesResponse(response) {
  const rawLeaveTypes =
    response?.leaveTypes ||
    response?.types ||
    response?.data?.leaveTypes ||
    response?.data?.types ||
    response?.data ||
    [];
  if (!Array.isArray(rawLeaveTypes)) return [];
  return rawLeaveTypes
    .filter((leaveType) => leaveType.isActive !== false)
    .map((leaveType) => ({
      id: leaveType._id || leaveType.id,
      name: leaveType.name || "Leave",
      code: leaveType.code || "",
      yearlyAllowance: leaveType.yearlyAllowance ?? 0,
      isPaid: leaveType.isPaid ?? true,
      requiresDocument: leaveType.requiresDocument ?? false,
      documentRequiredAfterDays: leaveType.documentRequiredAfterDays,
      allowHalfDay: leaveType.allowHalfDay ?? false,
      maxConsecutiveDays: leaveType.maxConsecutiveDays,
    }));
}

export function normalizeLeaveBalancesResponse(response) {
  const rawBalances =
    response?.balances ||
    response?.leaveBalances ||
    response?.data?.balances ||
    response?.data?.leaveBalances ||
    response?.data ||
    [];

  if (!Array.isArray(rawBalances)) return [];

  return rawBalances.map((balance) => {
    const leaveType = balance.leaveType;
    return {
      id: balance._id || balance.id,
      leaveTypeId: leaveType?._id || leaveType?.id || balance.leaveType,
      leaveTypeName: leaveType?.name || balance.leaveTypeName || "Leave",
      total: balance.total || balance.yearlyAllowance || balance.allocated || balance.entitled || 0,
      used: balance.used || balance.usedDays || 0,
      pending: balance.pending || balance.pendingDays || balance.reserved || 0,
      available: balance.available || balance.availableDays || balance.remaining || balance.balance || 0,
    };
  });
}
