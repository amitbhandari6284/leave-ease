import { ChevronDown, X } from "lucide-react";
import { useMemo } from "react";

import DateRangePicker from "../../../../components/ui/DateRangePicker.jsx";
import { parseInputDate, toInputDateString } from "../../../../lib/calendarUtils.js";

export default function FilterAndSearch({ applications, filters, onUpdateFilter, onClearFilters }) {
  const leaveTypes = useMemo(() => [...new Set(applications.map((application) => application.type))], [applications]);

  return (
    <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-full sm:p-0">
      <div className="flex flex-col divide-y divide-slate-200 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0 sm:pr-14">
        <div className="flex flex-[1.6] flex-col justify-center rounded-xl px-3 py-2.5 transition hover:bg-slate-50 sm:px-6">
          <label htmlFor="application-search" className="text-xs font-semibold text-slate-900">
            Search
          </label>
          <input
            id="application-search"
            type="search"
            value={filters.search}
            placeholder="Search applications..."
            className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            onChange={(event) => onUpdateFilter("search", event.target.value)}
          />
        </div>

        <div className="relative flex flex-1 flex-col justify-center rounded-xl px-3 py-2.5 transition hover:bg-slate-50 sm:px-6">
          <label htmlFor="application-status" className="text-xs font-semibold text-slate-900">
            Status
          </label>
          <select
            id="application-status"
            value={filters.status}
            onChange={(event) => onUpdateFilter("status", event.target.value)}
            className="appearance-none border-none bg-transparent p-0 pr-5 text-sm text-slate-900 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 bottom-3 size-3.5 text-slate-400 sm:right-5" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center rounded-xl px-3 py-2.5 transition hover:bg-slate-50 sm:px-6">
          <label htmlFor="application-type" className="text-xs font-semibold text-slate-900">
            Type
          </label>
          <select
            id="application-type"
            value={filters.type}
            onChange={(event) => onUpdateFilter("type", event.target.value)}
            className="appearance-none border-none bg-transparent p-0 pr-5 text-sm text-slate-900 outline-none"
          >
            <option value="All">All Types</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType} value={leaveType}>
                {leaveType}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 bottom-3 size-3.5 text-slate-400 sm:right-5" />
        </div>

        <DateRangePicker
          startDate={parseInputDate(filters.startDate)}
          endDate={parseInputDate(filters.endDate)}
          onChange={({ startDate, endDate }) => {
            onUpdateFilter("startDate", toInputDateString(startDate));
            onUpdateFilter("endDate", toInputDateString(endDate));
          }}
          minDate={null}
        />
      </div>

      <button
        type="button"
        onClick={onClearFilters}
        aria-label="Clear filters"
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:absolute sm:top-1/2 sm:right-2 sm:mt-0 sm:size-11 sm:w-11 sm:-translate-y-1/2 sm:rounded-full sm:p-0"
      >
        <X className="size-4 sm:size-5" />
        <span className="sm:hidden">Reset filters</span>
      </button>
    </section>
  );
}
