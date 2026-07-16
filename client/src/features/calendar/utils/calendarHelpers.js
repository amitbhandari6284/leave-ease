
export function formatFullDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function createCalendarDay(date, isCurrentMonth) {
  return {
    key: date.toISOString(),
    dateValue: toInputDateValue(date),
    dayNumber: date.getDate(),
    isCurrentMonth,
    isToday: toInputDateValue(date) === toInputDateValue(new Date()),
  };
}


export function buildCalendarDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const dayNumber = daysInPreviousMonth - index;
    const date = new Date(year, month - 1, dayNumber);

    cells.push(createCalendarDay(date, false));
  }

  for (let dayNumber = 1; dayNumber <= daysInCurrentMonth; dayNumber += 1) {
    const date = new Date(year, month, dayNumber);

    cells.push(createCalendarDay(date, true));
  }

  while (cells.length < 42) {
    const nextDayNumber = cells.length - firstWeekday - daysInCurrentMonth + 1;
    const date = new Date(year, month + 1, nextDayNumber);

    cells.push(createCalendarDay(date, false));
  }

  return cells;
}


export function parseInputDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function toInputDateValue(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().split("T")[0];
}

