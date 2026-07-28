import { ChevronLeft, ChevronRight } from "lucide-react";

import { DAY_LABELS, getMonthLabel, getMonthMatrix, isBetween, isSameDay } from "../../lib/calendarUtils.js";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",];

function MonthCalendar({
  year,
  month,
  startDate,
  endDate,
  hoveredDate,
  minDate,
  onSelectDate,
  onHoverDate,
  onPrevMonth,
  onNextMonth,
  onJumpToMonth,
}) {
  const weeks = getMonthMatrix(year, month);
  const previewEnd = endDate || hoveredDate;
  const currentYear = new Date().getFullYear();
  const earliestYear = minDate ? minDate.getFullYear() : currentYear - 10;
  const latestYear = currentYear + 10;
  const yearOptions = [];
  for (let optionYear = earliestYear; optionYear <= latestYear; optionYear += 1) {
    yearOptions.push(optionYear);
  }
  const selectClass =
    "rounded-md border border-slate-200 bg-white py-1 pr-1 pl-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500";

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        {onPrevMonth ? (
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : (
          <span className="size-7" />
        )}

        {onJumpToMonth ? (
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Jump to month"
              value={month}
              onChange={(event) => onJumpToMonth(year, Number(event.target.value))}
              className={selectClass}
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>

            <select
              aria-label="Jump to year"
              value={year}
              onChange={(event) => onJumpToMonth(Number(event.target.value), month)}
              className={selectClass}
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-900">{getMonthLabel(year, month)}</p>
        )}

        {onNextMonth ? (
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <span className="size-7" />
        )}
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
        {DAY_LABELS.map((label, index) => (
          <span key={index} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flatMap((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const key = `${weekIndex}-${dayIndex}`;
            if (!date) return <span key={key} />;
            const isDisabled = minDate && date < minDate;
            const isStart = isSameDay(date, startDate);
            const isEnd = isSameDay(date, endDate);
            const isInRange = isBetween(date, startDate, previewEnd);
            return (
              <button
                key={key}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectDate(date)}
                onMouseEnter={() => onHoverDate(date)}
                className={dayButtonClass({ isDisabled, isStart, isEnd, isInRange })}
              >
                {date.getDate()}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function dayButtonClass({ isDisabled, isStart, isEnd, isInRange }) {
  const base = "flex h-10 w-full items-center justify-center text-sm transition";
  if (isDisabled) return `${base} cursor-not-allowed text-slate-300`;
  if (isStart || isEnd) return `${base} rounded-full bg-indigo-600 font-semibold text-white`;
  if (isInRange) return `${base} bg-indigo-50 text-slate-900`;
  return `${base} text-slate-700 hover:rounded-full hover:bg-slate-100`;
}

export default MonthCalendar;
