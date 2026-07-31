export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getMonthLabel(year, month) {
  return `${MONTH_LABELS[month]} ${year}`;
}

// Returns a weeks[][] grid for the given month, padded with `null` for the
// leading/trailing empty cells so every week has exactly 7 slots.
export function getMonthMatrix(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function addMonths(year, month, delta) {
  const shifted = new Date(year, month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function isSameDay(dateA, dateB) {
  return (
    !!dateA &&
    !!dateB &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function isBetween(date, start, end) {
  if (!date || !start || !end) return false;
  return date.getTime() > start.getTime() && date.getTime() < end.getTime();
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function formatShortDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

// Bridges DateRangePicker's Date objects to the "YYYY-MM-DD" string format
// used by <input type="date">, react-hook-form fields, and API payloads.
export function parseInputDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toInputDateString(date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
