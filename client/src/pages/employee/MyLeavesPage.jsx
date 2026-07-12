import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import ApplicationCard from "../../features/leave-history/components/ApplicationCard";
import ApplicationTable from "../../features/leave-history/components/ApplicationTable";
import EmptyState from "../../features/leave-history/components/EmptyState";
import Pagination from "../../features/leave-history/components/Pagination";

import { escapeCsvValue } from "../../utils/helper";

const PAGE_SIZE = 3;

const DEFAULT_FILTERS = {
  search: "",
  status: "All",
  type: "All",
  startDate: "",
  endDate: "",
};

const initialApplications = [
  {
    id: 1,
    type: "Earned Leave",
    startDate: "2026-07-20",
    endDate: "2026-07-24",
    days: 5,
    appliedOn: "2026-07-08",
    status: "Pending",
    reason: "Family function",
  },
  {
    id: 2,
    type: "Sick Leave",
    startDate: "2026-06-10",
    endDate: "2026-06-11",
    days: 2,
    appliedOn: "2026-06-09",
    status: "Approved",
    reason: "Medical rest",
  },
  {
    id: 3,
    type: "Casual Leave",
    startDate: "2026-05-05",
    endDate: "2026-05-05",
    days: 1,
    appliedOn: "2026-05-01",
    status: "Rejected",
    reason: "Personal work",
  },
  {
    id: 4,
    type: "Casual Leave",
    startDate: "2026-04-17",
    endDate: "2026-04-18",
    days: 2,
    appliedOn: "2026-04-10",
    status: "Approved",
    reason: "Out-of-station visit",
  },
  {
    id: 5,
    type: "Earned Leave",
    startDate: "2026-03-02",
    endDate: "2026-03-06",
    days: 5,
    appliedOn: "2026-02-20",
    status: "Approved",
    reason: "Vacation",
  },
  {
    id: 6,
    type: "Sick Leave",
    startDate: "2026-02-11",
    endDate: "2026-02-11",
    days: 1,
    appliedOn: "2026-02-11",
    status: "Approved",
    reason: "Fever",
  },
  {
    id: 7,
    type: "Unpaid Leave",
    startDate: "2026-01-22",
    endDate: "2026-01-23",
    days: 2,
    appliedOn: "2026-01-15",
    status: "Rejected",
    reason: "Personal work",
  },
  {
    id: 8,
    type: "Casual Leave",
    startDate: "2026-01-08",
    endDate: "2026-01-09",
    days: 2,
    appliedOn: "2026-01-02",
    status: "Cancelled",
    reason: "Travel plans changed",
  },
];

function MyLeavesPage() {
  const [applications, setApplications] = useState(initialApplications);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [message, setMessage] = useState("");

  function updateFilter(key, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  const leaveTypes = useMemo(() => [...new Set(applications.map((application) => application.type))], [applications]);
  const filteredApplications = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesSearch =
        !normalizedSearch ||
        application.type.toLowerCase().includes(normalizedSearch) ||
        application.status.toLowerCase().includes(normalizedSearch) ||
        application.reason.toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "All" || application.status === filters.status;
      const matchesType = filters.type === "All" || application.type === filters.type;
      const matchesStartDate = !filters.startDate || application.startDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || application.endDate <= filters.endDate;

      return matchesSearch && matchesStatus && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [applications, filters]);
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const [previousFilters, setPreviousFilters] = useState(filters);
  if (filters !== previousFilters) {
    setPreviousFilters(filters);
    setCurrentPage(1);
  }

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedApplications = filteredApplications.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);
  const firstVisibleEntry = (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const lastVisibleEntry = Math.min(safeCurrentPage * PAGE_SIZE, filteredApplications.length);

  function cancelApplication(applicationId) {
    const confirmed = window.confirm("Are you sure you want to cancel this leave request?");
    if (!confirmed) return;

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === applicationId && application.status === "Pending"
          ? { ...application, status: "Cancelled" }
          : application,
      ),
    );

    setOpenMenuId(null);
    setMessage("The pending leave request has been cancelled.");
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function exportApplications() {
    const rows = filteredApplications.map((application) => ({
      "Leave Type": application.type,
      "Start Date": application.startDate,
      "End Date": application.endDate,
      Days: application.days,
      "Applied On": application.appliedOn,
      Status: application.status,
      Reason: application.reason,
    }));

    if (!rows.length) {
      setMessage("There are no leave applications to export.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","))];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "leave-applications.csv";
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
    setMessage("Leave applications exported successfully.");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Leave Applications</h1>
          <p className="mt-1 text-slate-500">Manage and track your time-off requests.</p>
        </div>
        <button
          type="button"
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-violet-50"
          onClick={exportApplications}
        >
          <Download className="size-4" />
          Export
        </button>
      </section>
      {message && (
        <div
          role="status"
          className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
        >
          <span>{message}</span>
          <button type="button" className="font-semibold" onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}
      <section className="mt-7 rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative md:col-span-2 xl:col-span-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              placeholder="Search applications..."
              className="h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </div>
          <select
            value={filters.status}
            className={`${filterInputClass} xl:col-span-2`}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={filters.type}
            className={`${filterInputClass} xl:col-span-2`}
            onChange={(event) => updateFilter("type", event.target.value)}
          >
            <option value="All">All Types</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType} value={leaveType}>
                {leaveType}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="Filter from date"
            value={filters.startDate}
            className={`${filterInputClass} xl:col-span-2`}
            onChange={(event) => updateFilter("startDate", event.target.value)}
          />
          <input
            type="date"
            aria-label="Filter to date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            className={`${filterInputClass} xl:col-span-2`}
            onChange={(event) => updateFilter("endDate", event.target.value)}
          />
          <button
            type="button"
            className="h-11 rounded-lg px-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 xl:col-span-1"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </section>
      <section className="mt-5 overflow-visible rounded-xl border border-violet-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-220 border-collapse text-left">
            <thead>
              <tr className="border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600">
                <th className="px-6 py-4 font-semibold">Leave Type</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Days</th>
                <th className="px-6 py-4 font-semibold">Applied On</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApplications.map((application) => (
                <ApplicationTable
                  key={application.id}
                  application={application}
                  isMenuOpen={openMenuId === application.id}
                  onToggleMenu={() => setOpenMenuId((currentId) => (currentId === application.id ? null : application.id))}
                  onCancel={() => cancelApplication(application.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-violet-100 md:hidden">
          {paginatedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} onCancel={() => cancelApplication(application.id)} />
          ))}
        </div>
        {filteredApplications.length === 0 && <EmptyState onClearFilters={clearFilters} />}
        {filteredApplications.length > 0 && (
          <footer className="flex flex-col gap-4 border-t border-violet-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing {firstVisibleEntry} to {lastVisibleEntry} of {filteredApplications.length} entries
            </p>
            <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </footer>
        )}
      </section>
    </div>
  );
}

const filterInputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

export default MyLeavesPage;
