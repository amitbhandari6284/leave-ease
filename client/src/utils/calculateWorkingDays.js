function parseDateInput(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function calculateWorkingDays(startDateValue, endDateValue) {
  const startDate = parseDateInput(startDateValue);
  const endDate = parseDateInput(endDateValue);

  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) {
      workingDays += 1;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

export function getTodayInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset).toISOString().split("T")[0];
}
