export function formatDate(dateValue) {
  if (!dateValue) return "—";
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatDateRange(startDateValue, endDateValue) {
  if (!startDateValue || !endDateValue) return "—";
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

export function formatInputDate(dateValue) {
  if (!dateValue) return "";
  return String(dateValue).slice(0, 10);
}

export function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function rowsToCsv(rows, fallbackHeaders = []) {
  if (rows.length === 0) {
    return `${fallbackHeaders.join(",")}\n`;
  }
  const headers = Object.keys(rows[0]);
  const csvRows = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));
  return [headers.join(","), ...csvRows].join("\n");
}

// --- Leave request domain helpers --------------------------------------

export function formatStatus(status = "") {
  const normalized = String(status).toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return "Pending";
}

export function canCancelApplication(status) {
  return status === "Pending";
}

const STATUS_BADGE_CLASSES = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
};

export function getStatusBadgeClass(status) {
  return STATUS_BADGE_CLASSES[status] || "bg-slate-100 text-slate-600";
}
