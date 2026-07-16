import { CalendarEvent } from "./CalendarEvent";

export function CalendarCell({ day, events, onSelect }) {
  return (
    <button
      type="button"
      className={`min-h-32 border-r border-b border-violet-200 p-3 text-left transition hover:bg-indigo-50/50 last:border-r-0 ${!day.isCurrentMonth ? "bg-violet-50/70 text-slate-400" : "bg-white"} ${day.isToday ? "ring-2 ring-inset ring-indigo-600" : ""}`}
      onClick={onSelect}
    >
      <span
        className={`text-sm font-medium ${day.isToday ? "text-indigo-700" : "text-slate-800"}`}
      >
        {day.dayNumber}
      </span>

      <div className="mt-3 space-y-2">
        {events.slice(0, 3).map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}

        {events.length > 3 && (
          <p className="text-xs font-medium text-indigo-600">
            +{events.length - 3} more
          </p>
        )}
      </div>
    </button>
  );
}

