
import { X, CalendarDays, UserRound } from "lucide-react"

import { formatFullDate } from "../../calendar/utils/calendarHelpers.js";

export default function DayDetailsDrawer({ dateValue, events, onClose }) {
  if (!dateValue) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40"
      onMouseDown={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-violet-200 px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Day Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {formatFullDate(dateValue)}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close day details"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {events.length === 0 ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-6 text-center">
              <CalendarDays className="mx-auto size-8 text-indigo-600" />

              <h3 className="mt-4 font-bold text-slate-950">
                No leaves scheduled
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No approved leaves, pending requests, or holidays found for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <DayEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function DayEventCard({ event }) {
  const statusClass = {
    Approved: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    Holiday: "bg-red-100 text-red-700",
  };

  return (
    <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-950">{event.title}</h3>

          <p className="mt-1 text-sm text-slate-500">
            {event.department}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[event.status]}`}
        >
          {event.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 text-sm">
        <div className="flex items-center gap-3">
          <UserRound className="size-4 text-slate-500" />

          <div>
            <p className="text-slate-500">Employee</p>
            <p className="font-semibold text-slate-900">
              {event.employee}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CalendarDays className="size-4 text-slate-500" />

          <div>
            <p className="text-slate-500">Leave Type</p>
            <p className="font-semibold text-slate-900">{event.type}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
