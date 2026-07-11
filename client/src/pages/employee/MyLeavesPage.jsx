import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  EllipsisVertical,
  FileText,
  HeartPulse,
  Search,
  Umbrella,
  WalletCards,
} from "lucide-react";

const PAGE_SIZE = 3;

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

const leaveTypeConfig = {
  "Casual Leave": {
    icon: Umbrella,
    className: "bg-indigo-50 text-indigo-600",
  },
  "Sick Leave": {
    icon: HeartPulse,
    className: "bg-teal-50 text-teal-700",
  },
  "Earned Leave": {
    icon: WalletCards,
    className: "bg-amber-50 text-amber-700",
  },
  "Unpaid Leave": {
    icon: CalendarDays,
    className: "bg-slate-100 text-slate-600",
  },
};

function MyLeavesPage() {
  const [applications, setApplications] = useState(initialApplications);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [message, setMessage] = useState("");

  const leaveTypes = useMemo(() => [...new Set(applications.map((application) => application.type))], [applications]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !normalizedSearch ||
        application.type.toLowerCase().includes(normalizedSearch) ||
        application.status.toLowerCase().includes(normalizedSearch) ||
        application.reason.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "All" || application.status === statusFilter;

      const matchesType = typeFilter === "All" || application.type === typeFilter;

      const matchesStartDate = !startDateFilter || application.startDate >= startDateFilter;

      const matchesEndDate = !endDateFilter || application.endDate <= endDateFilter;

      return matchesSearch && matchesStatus && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [applications, searchTerm, statusFilter, typeFilter, startDateFilter, endDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));

  const paginatedApplications = filteredApplications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const firstVisibleEntry = filteredApplications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const lastVisibleEntry = Math.min(currentPage * PAGE_SIZE, filteredApplications.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    setSearchTerm("");
    setStatusFilter("All");
    setTypeFilter("All");
    setStartDateFilter("");
    setEndDateFilter("");
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_170px_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchTerm}
              placeholder="Search applications..."
              className="h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select value={statusFilter} className={filterInputClass} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select value={typeFilter} className={filterInputClass} onChange={(event) => setTypeFilter(event.target.value)}>
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
            value={startDateFilter}
            className={filterInputClass}
            onChange={(event) => setStartDateFilter(event.target.value)}
          />

          <input
            type="date"
            aria-label="Filter to date"
            value={endDateFilter}
            min={startDateFilter || undefined}
            className={filterInputClass}
            onChange={(event) => setEndDateFilter(event.target.value)}
          />

          <button
            type="button"
            className="h-11 rounded-lg px-4 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </section>

      <section className="mt-5 overflow-visible rounded-xl border border-violet-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] border-collapse text-left">
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
                <ApplicationTableRow
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

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </footer>
        )}
      </section>
    </div>
  );
}

function ApplicationTableRow({ application, isMenuOpen, onToggleMenu, onCancel }) {
  return (
    <tr className="border-b border-violet-100 text-sm last:border-b-0">
      <td className="px-6 py-5">
        <LeaveTypeDisplay type={application.type} />
      </td>

      <td className="px-6 py-5 text-slate-700">
        {formatDate(application.startDate)} – {formatDate(application.endDate)}
      </td>

      <td className="px-6 py-5 font-medium text-slate-800">{application.days}</td>

      <td className="px-6 py-5 text-slate-600">{formatDate(application.appliedOn)}</td>

      <td className="px-6 py-5">
        <StatusBadge status={application.status} />
      </td>

      <td className="relative px-6 py-5 text-right">
        <button
          type="button"
          aria-label={`Actions for ${application.type}`}
          aria-expanded={isMenuOpen}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
          onClick={onToggleMenu}
        >
          <EllipsisVertical className="size-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute top-14 right-6 z-10 w-40 rounded-lg border border-violet-200 bg-white p-1 text-left shadow-lg">
            <button type="button" className="w-full rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              View details
            </button>

            {application.status === "Pending" && (
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={onCancel}
              >
                Cancel request
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function ApplicationCard({ application, onCancel }) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <LeaveTypeDisplay type={application.type} />

        <StatusBadge status={application.status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Duration</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {formatDate(application.startDate)} – {formatDate(application.endDate)}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Days</dt>
          <dd className="mt-1 font-medium text-slate-800">{application.days}</dd>
        </div>

        <div>
          <dt className="text-slate-500">Applied on</dt>
          <dd className="mt-1 font-medium text-slate-800">{formatDate(application.appliedOn)}</dd>
        </div>

        <div>
          <dt className="text-slate-500">Reason</dt>
          <dd className="mt-1 font-medium text-slate-800">{application.reason}</dd>
        </div>
      </dl>

      {application.status === "Pending" && (
        <button type="button" className="mt-5 text-sm font-semibold text-red-600 hover:text-red-700" onClick={onCancel}>
          Cancel request
        </button>
      )}
    </article>
  );
}

function LeaveTypeDisplay({ type }) {
  const config = leaveTypeConfig[type] ?? {
    icon: FileText,
    className: "bg-slate-100 text-slate-600",
  };

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config.className}`}>
        <Icon className="size-4" />
      </div>

      <span className="font-semibold text-slate-900">{type}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClasses = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
    Cancelled: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        statusClasses[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage === 1}
        className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <button
          type="button"
          key={pageNumber}
          className={`size-9 rounded-lg text-sm font-semibold ${
            currentPage === pageNumber ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function EmptyState({ onClearFilters }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <FileText className="size-6" />
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-900">No leave applications found</h2>

      <p className="mt-2 text-sm text-slate-500">Try changing or clearing the selected filters.</p>

      <button type="button" className="mt-5 text-sm font-semibold text-indigo-600" onClick={onClearFilters}>
        Clear filters
      </button>
    </div>
  );
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

const filterInputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

export default MyLeavesPage;
