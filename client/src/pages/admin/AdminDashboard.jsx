import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  FilePlus2,
  Gavel,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router";

const overviewStats = [
  {
    label: "Total Employees",
    value: "1,248",
    note: "+4%",
    icon: Users,
    iconClass: "bg-indigo-100 text-indigo-700",
    noteClass: "bg-teal-100 text-teal-700",
  },
  {
    label: "Active Departments",
    value: "24",
    note: "",
    icon: Building2,
    iconClass: "bg-teal-100 text-teal-700",
  },
  {
    label: "Active Leave Policies",
    value: "12",
    note: "2 Updates",
    icon: Gavel,
    iconClass: "bg-orange-100 text-orange-700",
    noteClass: "bg-violet-100 text-slate-600",
  },
  {
    label: "Pending Requests",
    value: "86",
    note: "",
    icon: CalendarClock,
    iconClass: "bg-red-100 text-red-600",
    hasAlert: true,
  },
];

const usageData = [
  { day: "Mon", value: 38 },
  { day: "Tue", value: 76 },
  { day: "Wed", value: 57 },
  { day: "Thu", value: 100 },
  { day: "Fri", value: 32 },
  { day: "Sat", value: 69 },
  { day: "Sun", value: 50 },
];

const activities = [
  {
    id: 1,
    title: 'New Policy Added: "WFH Guidelines 2024"',
    meta: "2 hours ago by System Admin",
    icon: ShieldCheck,
    iconClass: "bg-indigo-100 text-indigo-700",
  },
  {
    id: 2,
    title: "Batch User Import completed successfully.",
    meta: "5 hours ago by HR Dept",
    icon: UserPlus,
    iconClass: "bg-teal-100 text-teal-700",
  },
  {
    id: 3,
    title: "System Alert: Approver mismatch in Engineering dept.",
    meta: "Yesterday",
    icon: AlertTriangle,
    iconClass: "bg-red-100 text-red-600",
  },
  {
    id: 4,
    title: "Settings Updated: Global leave accrual rules modified.",
    meta: "Oct 24, 2023",
    icon: SlidersHorizontal,
    iconClass: "bg-slate-100 text-slate-600",
  },
];

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            System Overview
          </h1>

          <p className="mt-1 text-slate-500">
            Manage workforce metrics and leave policies.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/policies"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-5 text-sm font-semibold text-slate-800 transition hover:bg-violet-100"
          >
            <FilePlus2 className="size-4" />
            Create Policy
          </Link>

          <Link
            to="/users"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <UserPlus className="size-4" />
            Add User
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <OverviewCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <LeaveUsageAnalytics />

        <RecentActivity />
      </section>
    </div>
  );
}

function OverviewCard({ stat }) {
  const Icon = stat.icon;

  return (
    <article className="relative overflow-hidden rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      {stat.hasAlert && (
        <span className="absolute top-6 right-6 size-2 rounded-full bg-red-600" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex size-12 items-center justify-center rounded-lg ${stat.iconClass}`}
        >
          <Icon className="size-5" />
        </div>

        {stat.note && (
          <span
            className={`rounded-md px-3 py-1 text-xs font-semibold ${stat.noteClass}`}
          >
            {stat.note}
          </span>
        )}
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-600">
        {stat.label}
      </p>

      <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
        {stat.value}
      </p>
    </article>
  );
}

function LeaveUsageAnalytics() {
  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-indigo-600" />

          <h2 className="text-xl font-bold text-slate-950">
            Leave Usage Analytics
          </h2>
        </div>

        <select className="h-10 w-fit rounded-lg border border-violet-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
        </select>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-5">
        <div className="flex h-64 items-end gap-3 sm:gap-5">
          {usageData.map((item, index) => (
            <div
              key={item.day}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div
                className={`rounded-t-md ${index % 2 === 0 ? "bg-indigo-200" : "bg-indigo-600"
                  }`}
                style={{ height: `${item.value}%` }}
                title={`${item.day}: ${item.value}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-3 text-center text-xs text-slate-600">
          {usageData.map((item) => (
            <span key={item.day}>{item.day}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentActivity() {
  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-950">
          Recent Activity
        </h2>

        <button
          type="button"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View All
        </button>
      </header>

      <div className="mt-6 space-y-5">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}

function ActivityItem({ activity }) {
  const Icon = activity.icon;

  return (
    <article className="flex gap-4">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${activity.iconClass}`}
      >
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-sm font-bold leading-5 text-slate-900">
          {activity.title}
        </p>

        <p className="mt-1 text-sm text-slate-500">{activity.meta}</p>
      </div>
    </article>
  );
}

export default AdminDashboard;
