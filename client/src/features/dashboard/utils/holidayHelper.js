const TYPE_STYLES = {
  PUBLIC: "bg-indigo-50 text-indigo-600",
  OPTIONAL: "bg-amber-50 text-amber-700",
  RESTRICTED: "bg-teal-50 text-teal-700",
};

export function getTypeClass(type) {
  return TYPE_STYLES[type] || "bg-slate-100 text-slate-600";
}

export function formatHolidayDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getDaysAway(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function daysAwayLabel(diffDays) {
  if (diffDays === null) return "";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `In ${diffDays} days`;
  return "";
}

