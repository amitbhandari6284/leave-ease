import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import DayDetailsDrawer from "../../features/calendar/components/DayDetailsDrawer";
import { CalendarCell } from "../../features/calendar/components/CalendarCell";
import { buildCalendarDays, parseInputDate } from "../../features/calendar/utils/calendarHelpers.js";


const filterClass =
  "h-11 rounded-lg border border-violet-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";


const calendarEvents = [
  {
    id: 1,
    employee: "J. Smith",
    title: "J. Smith - Annual",
    date: "2023-10-05",
    department: "Engineering",
    status: "Approved",
    type: "Annual",
  },
  {
    id: 2,
    employee: "J. Smith",
    title: "J. Smith - Annual",
    date: "2023-10-06",
    department: "Engineering",
    status: "Approved",
    type: "Annual",
  },
  {
    id: 3,
    employee: "A. Davis",
    title: "A. Davis - Sick",
    date: "2023-10-16",
    department: "Marketing",
    status: "Pending",
    type: "Sick",
  },
  {
    id: 4,
    employee: "M. Lee",
    title: "M. Lee - Annual",
    date: "2023-10-16",
    department: "Engineering",
    status: "Approved",
    type: "Annual",
  },
  {
    id: 5,
    employee: "S. Taylor",
    title: "S. Taylor - Unpaid",
    date: "2023-10-20",
    department: "Finance",
    status: "Pending",
    type: "Unpaid",
  },
  {
    id: 6,
    employee: "Public Holiday",
    title: "Public Holiday",
    date: "2023-10-10",
    department: "All",
    status: "Holiday",
    type: "Holiday",
  },
];

const departments = ["All Departments", "Engineering", "Marketing", "Finance"];
const statuses = ["All Statuses", "Approved", "Pending", "Holiday"];
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


function DepartmentCalendarPage() {
  const [visibleDate, setVisibleDate] = useState(new Date(2023, 9, 1));
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedDateValue, setSelectedDateValue] = useState(null);

  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleDate);
  const calendarDays = useMemo(
    () => buildCalendarDays(year, month),
    [year, month],
  );
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((event) => {
      const eventDate = parseInputDate(event.date);
      const isVisibleMonth =
        eventDate.getFullYear() === year && eventDate.getMonth() === month;
      const matchesDepartment =
        departmentFilter === "All Departments" ||
        event.department === departmentFilter ||
        event.department === "All";
      const matchesStatus =
        statusFilter === "All Statuses" || event.status === statusFilter;

      return isVisibleMonth && matchesDepartment && matchesStatus;
    });
  }, [year, month, departmentFilter, statusFilter]);

  function getEventsForDay(dateValue) {
    return filteredEvents.filter((event) => event.date === dateValue);
  }

  const selectedDateEvents = selectedDateValue
    ? getEventsForDay(selectedDateValue)
    : [];

  function goToPreviousMonth() {
    setVisibleDate((currentDate) => {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    });
  }

  function goToNextMonth() {
    setVisibleDate((currentDate) => {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Department Calendar
          </h1>

          <p className="mt-1 text-slate-500">
            View approved leaves, pending requests, and holidays across teams.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={departmentFilter}
            className={filterClass}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            className={filterClass}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-violet-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex h-12 w-full items-center justify-between rounded-lg border border-violet-200 bg-white px-3 sm:w-72">
            <button
              type="button"
              aria-label="Previous month"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="size-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-950">{monthLabel}</h2>

            <button
              type="button"
              aria-label="Next month"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={goToNextMonth}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <Legend />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-violet-200">
          <div className="min-w-225">
            <div className="grid grid-cols-7 border-b border-violet-200 bg-violet-50">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="border-r border-violet-200 px-4 py-4 text-center text-sm font-bold text-slate-700 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => (
                <CalendarCell
                  key={day.key}
                  day={day}
                  events={getEventsForDay(day.dateValue)}
                  onSelect={() => setSelectedDateValue(day.dateValue)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <DayDetailsDrawer
        dateValue={selectedDateValue}
        events={selectedDateEvents}
        onClose={() => setSelectedDateValue(null)}
      />

    </div>
  );
}
function Legend() {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-violet-200 bg-white px-4 py-3 text-sm text-slate-600">
      <LegendItem className="border-emerald-300 bg-emerald-100" label="Approved" />
      <LegendItem className="border-amber-300 bg-amber-100 border-dashed" label="Pending" />
      <LegendItem className="border-red-300 bg-red-100" label="Holiday" />
      <LegendItem className="border-indigo-600 bg-white" label="Current Date" />
    </div>
  );
}

function LegendItem({ className, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-4 rounded border ${className}`} />
      <span>{label}</span>
    </div>
  );
}


export default DepartmentCalendarPage;
