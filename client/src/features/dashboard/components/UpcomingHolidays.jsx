import { CalendarDays, PartyPopper } from "lucide-react";
import { daysAwayLabel, formatHolidayDate, getDaysAway, getTypeClass } from "../utils/holidayHelper";

function HolidayRow({ holiday }) {
  const diffDays = getDaysAway(holiday.date);

  return (
    <li className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${getTypeClass(holiday.type)}`}>
          <CalendarDays className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{holiday.name}</p>
          {holiday.description && (
            <p className="text-xs text-slate-500">{holiday.description}</p>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-slate-700">{formatHolidayDate(holiday.date)}</p>
        {daysAwayLabel(diffDays) && (
          <p className="text-xs text-indigo-600">{daysAwayLabel(diffDays)}</p>
        )}
      </div>
    </li>
  );
}

export function UpcomingHolidays({ holidays = [] }) {
  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-950">Upcoming Holidays</h2>
      </header>

      <div className="px-6 py-2">
        {holidays.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <PartyPopper className="size-6 text-slate-300" />
            <p className="text-sm text-slate-500">No upcoming holidays</p>
          </div>
        ) : (
          <ul className="divide-y divide-violet-100">
            {holidays.map((holiday) => (
              <HolidayRow key={holiday.id} holiday={holiday} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
