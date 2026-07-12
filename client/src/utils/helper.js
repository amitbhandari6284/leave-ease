export function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function formatDateRange(startDateValue, endDateValue) {
  const [startYear, startMonth, startDay] = startDateValue.split("-").map(Number);

  const [endYear, endMonth, endDay] = endDateValue.split("-").map(Number);

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);

  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(startDate);

  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(endDate);

  return `${startLabel} – ${endLabel}`;
}
