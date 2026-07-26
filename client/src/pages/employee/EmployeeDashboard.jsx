import { useEffect, useState } from "react";
import { BadgeIndianRupee, CalendarOff, CirclePlus, Stethoscope, Plane } from "lucide-react";
import { Link } from "react-router";

import ApplicationItem, { GRID_COLUMNS } from "../../components/ui/ApplicationItem.jsx";
import ApplicationDetailsDialog from "../../components/ui/ApplicationDetailsDialog.jsx";

const leaveBalances = [
  {
    name: "Casual Leave",
    remaining: "04",
    remainingLabel: "Days remaining",
    used: 8,
    total: 12,
    progress: 67,
    icon: Plane,
    iconClass: "bg-indigo-50 text-indigo-600",
    progressClass: "bg-indigo-600",
  },
  {
    name: "Sick Leave",
    remaining: "06",
    remainingLabel: "Days remaining",
    used: 2,
    total: 8,
    progress: 25,
    icon: Stethoscope,
    iconClass: "bg-teal-50 text-teal-700",
    progressClass: "bg-teal-700",
  },
  {
    name: "Earned Leave",
    remaining: "15",
    remainingLabel: "Days remaining",
    used: 5,
    total: 20,
    progress: 25,
    icon: BadgeIndianRupee,
    iconClass: "bg-orange-100 text-amber-800",
    progressClass: "bg-amber-800",
  },
  {
    name: "Unpaid Leave",
    remaining: "--",
    remainingLabel: "Days",
    used: 3,
    total: "--",
    progress: 15,
    icon: CalendarOff,
    iconClass: "bg-violet-50 text-slate-500",
    progressClass: "bg-slate-500",
  },
];

// Same application shape used across the app (leaveMappers.js produces this
// from real API responses) so this widget can reuse the shared components
// as-is instead of a parallel, drifting implementation.
const recentApplications = [
  {
    id: 1,
    type: "Casual Leave",
    status: "Approved",
    startDate: "2023-10-12",
    endDate: "2023-10-13",
    days: 2,
    appliedOn: "2023-10-05",
    reason: "Family function out of town.",
    remarks: "",
    documentUrl: "",
  },
  {
    id: 2,
    type: "Sick Leave",
    status: "Approved",
    startDate: "2023-09-28",
    endDate: "2023-09-28",
    days: 1,
    appliedOn: "2023-09-28",
    reason: "Fever, resting at home.",
    remarks: "",
    documentUrl: "",
  },
  {
    id: 3,
    type: "Earned Leave",
    status: "Pending",
    startDate: "2023-11-20",
    endDate: "2023-11-24",
    days: 5,
    appliedOn: "2023-10-20",
    reason: "Annual family trip.",
    remarks: "",
    documentUrl: "",
  },
];

function EmployeeDashboard() {
  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good morning, Amit</h1>

          <p className="mt-1 text-sm text-slate-500">{currentDate}</p>
        </div>

        <Link
          to="/apply-leave"
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <CirclePlus className="size-5" />
          Apply for Leave
        </Link>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {leaveBalances.map((leave) => (
          <LeaveBalanceCard key={leave.name} leave={leave} />
        ))}
      </section>

      <RecentApplications />
    </div>
  );
}

function LeaveBalanceCard({ leave }) {
  const Icon = leave.icon;

  return (
    <article className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">{leave.name}</p>

        <div className={`flex size-9 items-center justify-center rounded-full ${leave.iconClass}`}>
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight text-slate-950">{leave.remaining}</span>

        <span className="pb-1 text-sm text-slate-600">{leave.remainingLabel}</span>
      </div>

      <div className="mt-5 flex justify-between text-xs text-slate-600">
        <span>Used: {leave.used}</span>
        <span>Total: {leave.total}</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
        <div className={`h-full rounded-full ${leave.progressClass}`} style={{ width: `${leave.progress}%` }} />
      </div>
    </article>
  );
}

function RecentApplications() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest("[data-leave-menu]")) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  function handleViewDetails(application) {
    setSelectedApplication(application);
    setOpenMenuId(null);
  }

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-950">Recent Leave Applications</h2>

        <Link to="/my-leaves" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          View All
        </Link>
      </header>

      <div role="table" aria-label="Recent leave applications">
        <div
          role="row"
          className={`hidden border-b border-violet-200 bg-violet-50 px-6 py-4 text-xs tracking-wide text-slate-600 uppercase md:grid md:items-center md:gap-4 ${GRID_COLUMNS}`}
        >
          <span role="columnheader">Leave Type</span>
          <span role="columnheader">Duration</span>
          <span role="columnheader">Days</span>
          <span role="columnheader">Applied On</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className="text-right">
            Actions
          </span>
        </div>

        <div className="divide-y divide-violet-100">
          {recentApplications.map((application, index) => (
            <ApplicationItem
              key={application.id}
              application={application}
              isMenuOpen={openMenuId === application.id}
              openUpward={index === recentApplications.length - 1}
              allowCancel={false}
              onToggleMenu={() => setOpenMenuId((currentId) => (currentId === application.id ? null : application.id))}
              onViewDetails={() => handleViewDetails(application)}
            />
          ))}
        </div>
      </div>

      {selectedApplication && (
        <ApplicationDetailsDialog application={selectedApplication} allowCancel={false} onClose={() => setSelectedApplication(null)} />
      )}
    </section>
  );
}

export default EmployeeDashboard;
