import { useEffect, useRef, useState } from "react";

import MonthCalendar from "./MonthCalendar.jsx";
import { addMonths, formatShortDate, startOfToday } from "../../utils/calendarUtils.js";

const DEFAULT_TRIGGER_CLASS =
  "flex shrink-0 flex-col items-start rounded-xl px-3 py-2.5 text-left whitespace-nowrap transition hover:bg-slate-50 sm:rounded-full sm:px-6 sm:py-3";

function toValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
}

function DateRangePicker({ startDate, endDate, onChange, triggerClassName, minDate = startOfToday() }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const anchorDate = toValidDate(startDate) ?? toValidDate(minDate) ?? startOfToday();
    return { year: anchorDate.getFullYear(), month: anchorDate.getMonth() };
  });

  const containerRef = useRef(null);
  const nextMonth = addMonths(visibleMonth.year, visibleMonth.month, 1);

  function handleJumpToMonth(year, month) {
    setVisibleMonth({ year, month });
  }

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  // Whenever the selected range is cleared (either from this component's own
  // "Clear dates" button, or from a parent resetting its filters), snap the
  // visible month back to the anchor date instead of leaving it wherever the
  // user last navigated to.
  useEffect(() => {
    if (toValidDate(startDate) || toValidDate(endDate)) return;

    const resetAnchor = toValidDate(minDate) ?? startOfToday();
    setVisibleMonth({ year: resetAnchor.getFullYear(), month: resetAnchor.getMonth() });
  }, [startDate, endDate]);

  function handleSelectDate(date) {
    const isRangeAlreadyComplete = startDate && endDate;

    if (!startDate || isRangeAlreadyComplete || date < startDate) {
      onChange({ startDate: date, endDate: null });
      return;
    }

    onChange({ startDate, endDate: date });
  }

  function handleClear() {
    setHoveredDate(null);
    onChange({ startDate: null, endDate: null });
  }

  const label = startDate
    ? endDate
      ? `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
      : `${formatShortDate(startDate)} – Add end date`
    : "Add dates";

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className={triggerClassName ?? DEFAULT_TRIGGER_CLASS}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="text-xs font-semibold text-slate-900">When</span>
        <span className={`text-sm whitespace-nowrap ${startDate ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-30 mt-3 w-[min(640px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-8">
            <MonthCalendar
              year={visibleMonth.year}
              month={visibleMonth.month}
              startDate={startDate}
              endDate={endDate}
              hoveredDate={hoveredDate}
              minDate={minDate}
              onSelectDate={handleSelectDate}
              onHoverDate={setHoveredDate}
              onPrevMonth={() => setVisibleMonth((current) => addMonths(current.year, current.month, -1))}
              onJumpToMonth={handleJumpToMonth}
            />
            <MonthCalendar
              year={nextMonth.year}
              month={nextMonth.month}
              startDate={startDate}
              endDate={endDate}
              hoveredDate={hoveredDate}
              minDate={minDate}
              onSelectDate={handleSelectDate}
              onHoverDate={setHoveredDate}
              onNextMonth={() => setVisibleMonth((current) => addMonths(current.year, current.month, 1))}
            />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <button type="button" className="text-sm font-semibold text-slate-700 underline" onClick={handleClear}>
              Clear dates
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
