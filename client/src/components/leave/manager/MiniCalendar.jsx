import { CalendarDays } from "lucide-react";

function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(today);

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const calendarCells = [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  const leaveDates = new Set([8, 9, 15, 16, 22, 23]);
  const publicHoliday = 10;

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">{monthLabel}</h2>

        <CalendarDays className="size-5 text-slate-600" />
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1 text-xs font-semibold text-slate-500">
            {day}
          </span>
        ))}

        {calendarCells.map((day, index) => {
          const isToday = day === today.getDate();
          const isLeaveDate = leaveDates.has(day);
          const isHoliday = day === publicHoliday;

          return (
            <div
              key={`${day}-${index}`}
              className={`relative flex aspect-square items-center justify-center rounded-md text-sm ${
                isToday
                  ? "bg-indigo-600 font-semibold text-white"
                  : isLeaveDate
                    ? "bg-violet-100 text-slate-800"
                    : "text-slate-700"
              }`}
            >
              {day}

              {isHoliday && <span className="absolute bottom-0.5 size-1 rounded-full bg-orange-700" />}
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-violet-200 pt-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-orange-700" />
          Public Holiday
        </div>

        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-teal-700" />
          High Leave Volume
        </div>
      </div>
    </section>
  );
}

export default MiniCalendar;
