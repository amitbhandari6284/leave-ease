import { formatDateOnly, parseDateOnly } from "./dateOnly.js";

export function calculateWorkingDays({ startDate, endDate, holidayDates = [] }) {
  const parsedStartDate = parseDateOnly(startDate);
  const parsedEndDate = parseDateOnly(endDate);

  if (!parsedStartDate || !parsedEndDate) {
    throw new Error("Start date and end date must be valid dates in YYYY-MM-DD format");
  }

  if (parsedEndDate < parsedStartDate) {
    throw new Error("End date cannot be earlier than start date");
  }

  const holidayDateKeys = new Set(holidayDates.map((holidayDate) => formatDateOnly(holidayDate)).filter(Boolean));

  let workingDays = 0;

  const currentDate = new Date(parsedStartDate);

  while (currentDate <= parsedEndDate) {
    const dayOfWeek = currentDate.getUTCDay();

    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekend = isSaturday || isSunday;

    const dateKey = formatDateOnly(currentDate);
    const isHoliday = holidayDateKeys.has(dateKey);

    if (!isWeekend && !isHoliday) {
      workingDays += 1;
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return workingDays;
}
