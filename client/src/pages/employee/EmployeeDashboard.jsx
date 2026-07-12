import { BadgeIndianRupee, CalendarOff, CirclePlus, EllipsisVertical, Stethoscope, Plane } from "lucide-react";
import { Link } from "react-router";

import StatusBadge from "../../components/leave/history/StatusBadge";

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

const recentApplications = [
  {
    id: 1,
    type: "Casual Leave",
    range: "Oct 12 - Oct 13, 2023",
    days: 2,
    appliedDate: "Oct 05, 2023",
    status: "Approved",
    dotClass: "bg-indigo-600",
  },
  {
    id: 2,
    type: "Sick Leave",
    range: "Sep 28 - Sep 28, 2023",
    days: 1,
    appliedDate: "Sep 28, 2023",
    status: "Approved",
    dotClass: "bg-teal-700",
  },
  {
    id: 3,
    type: "Earned Leave",
    range: "Nov 20 - Nov 24, 2023",
    days: 5,
    appliedDate: "Oct 20, 2023",
    status: "Pending",
    dotClass: "bg-amber-800",
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
  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-950">Recent Leave Applications</h2>

        <Link to="/my-leaves" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          View All
        </Link>
      </header>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-violet-200 text-xs font-medium text-slate-600">
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Range</th>
              <th className="px-6 py-4">Days</th>
              <th className="px-6 py-4">Applied Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {recentApplications.map((application) => (
              <tr key={application.id} className="border-b border-violet-100 text-sm last:border-b-0">
                <td className="px-6 py-4 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${application.dotClass}`} />
                    {application.type}
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-800">{application.range}</td>

                <td className="px-6 py-4 text-slate-800">{application.days}</td>

                <td className="px-6 py-4 text-slate-600">{application.appliedDate}</td>

                <td className="px-6 py-4">
                  <StatusBadge status={application.status} />
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    aria-label={`Actions for ${application.type}`}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <EllipsisVertical className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-violet-100 md:hidden">
        {recentApplications.map((application) => (
          <article key={application.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${application.dotClass}`} />

                  <h3 className="font-semibold text-slate-900">{application.type}</h3>
                </div>

                <p className="mt-2 text-sm text-slate-600">{application.range}</p>
              </div>

              <StatusBadge status={application.status} />
            </div>

            <div className="mt-4 flex justify-between text-sm text-slate-500">
              <span>{application.days} day(s)</span>
              <span>{application.appliedDate}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// function StatusBadge({ status }) {
//   const statusClass =
//     status === "Approved"
//       ? "bg-green-100 text-green-700"
//       : status === "Pending"
//         ? "bg-orange-100 text-orange-700"
//         : "bg-red-100 text-red-700";

//   return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>{status}</span>;
// }

export default EmployeeDashboard;
