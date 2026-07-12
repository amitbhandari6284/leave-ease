import { CircleCheck, CircleX, Clock3, Download, Umbrella } from "lucide-react";

import AvailabilityCard from "../../components/leave/manager/AvailabilityCard";
import MiniCalendar from "../../components/leave/manager/MiniCalendar";
import PendingRequests from "../../components/leave/manager/PendingRequests";
import StatCard from "../../components/leave/manager/StatCard";

import { escapeCsvValue } from "../../utils/helper";

const dashboardStats = [
  {
    label: "Pending Requests",
    value: 24,
    description: "+5 since yesterday",
    icon: Clock3,
    iconClass: "bg-orange-100 text-orange-700",
    descriptionClass: "text-orange-700",
  },
  {
    label: "Employees on Leave",
    value: 12,
    description: "Across 4 departments",
    icon: Umbrella,
    iconClass: "bg-indigo-100 text-indigo-700",
    descriptionClass: "text-slate-600",
  },
  {
    label: "Approved This Month",
    value: 86,
    description: "+12% from last month",
    icon: CircleCheck,
    iconClass: "bg-teal-100 text-teal-700",
    descriptionClass: "text-teal-700",
  },
  {
    label: "Rejected This Month",
    value: 4,
    description: "Policy violations primarily",
    icon: CircleX,
    iconClass: "bg-red-100 text-red-600",
    descriptionClass: "text-slate-600",
  },
];

const pendingRequests = [
  {
    id: "request-1",
    employee: "Marcus Chen",
    initials: "MC",
    department: "Engineering",
    leaveType: "Annual Leave",
    submittedOn: "2026-07-07",
    startDate: "2026-07-15",
    endDate: "2026-07-20",
    days: 4,
  },
  {
    id: "request-2",
    employee: "Amanda Lee",
    initials: "AL",
    department: "Marketing",
    leaveType: "Sick Leave",
    submittedOn: "2026-07-08",
    startDate: "2026-07-14",
    endDate: "2026-07-15",
    days: 2,
    hasDocument: true,
  },
  {
    id: "request-3",
    employee: "David Okafor",
    initials: "DO",
    department: "Finance",
    leaveType: "Annual Leave",
    submittedOn: "2026-07-09",
    startDate: "2026-07-22",
    endDate: "2026-07-31",
    days: 8,
  },
];

function HRDashboard() {
  function exportReport() {
    const headers = ["Employee", "Department", "Leave Type", "Start Date", "End Date", "Days", "Submitted On"];

    const rows = pendingRequests.map((request) => [
      request.employee,
      request.department,
      request.leaveType,
      request.startDate,
      request.endDate,
      request.days,
      request.submittedOn,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(","))].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pending-leave-requests.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">HR Manager Dashboard</h1>

          <p className="mt-1 text-slate-500">Overview of pending requests and team availability.</p>
        </div>

        <button
          type="button"
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-violet-50"
          onClick={exportReport}
        >
          <Download className="size-4" />
          Export Report
        </button>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_305px]">
        <PendingRequests pendingRequests={pendingRequests} dashboardStats={dashboardStats} />

        <aside className="space-y-6">
          <AvailabilityCard />
          <MiniCalendar />
        </aside>
      </div>
    </div>
  );
}

export default HRDashboard;
