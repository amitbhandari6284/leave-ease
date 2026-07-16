export function CalendarEvent({ event }) {
  const eventClass = {
    Approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
    Pending: "border-amber-300 bg-amber-100 text-amber-800 border-dashed",
    Holiday: "border-red-200 bg-red-100 text-red-700",
  };

  return (
    <div
      title={`${event.title} · ${event.department}`}
      className={`w-full truncate rounded-md border px-2 py-1 text-xs font-medium ${eventClass[event.status]}`}
    >
      {event.title}
    </div>
  );
}

