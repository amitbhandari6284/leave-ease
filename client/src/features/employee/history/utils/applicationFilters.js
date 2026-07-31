export function applicationMatchesFilters(application, filters) {
  return (
    matchesSearch(application, filters.search) &&
    matchesStatus(application, filters.status) &&
    matchesType(application, filters.type) &&
    matchesDateRange(application, filters.startDate, filters.endDate)
  );
}

function matchesSearch(application, search) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return [application.type, application.status, application.reason].some((field) =>
    field.toLowerCase().includes(normalized),
  );
}

function matchesStatus(application, status) {
  return status === "All" || application.status === status;
}

function matchesType(application, type) {
  return type === "All" || application.type === type;
}

function matchesDateRange(application, startDate, endDate) {
  const isAfterStart = !startDate || application.startDate >= startDate;
  const isBeforeEnd = !endDate || application.endDate <= endDate;
  return isAfterStart && isBeforeEnd;
}
