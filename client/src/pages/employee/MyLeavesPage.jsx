import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";

import ApplicationDetailsDialog from "../../components/ui/ApplicationDetailsDialog.jsx";
import Summary from "../../features/employee/history/components/Summary.jsx";
import FilterAndSearch from "../../features/employee/history/components/FilterAndSearch.jsx";

import { rowsToCsv } from "../../lib/helper.js";
import { cancelLeaveRequest, getMyLeaveRequests } from "../../features/leave/lib/leaveApi.js";
import { normalizeLeaveRequestsResponse } from "../../features/employee/history/lib/leaveMappers.js";
import { applicationMatchesFilters } from "../../features/employee/history/lib/applicationFilters.js";
import Applications from "../../features/employee/history/components/Applications.jsx";

const DEFAULT_FILTERS = {
  search: "",
  status: "All",
  type: "All",
  startDate: "",
  endDate: "",
};

const PAGE_SIZE = 10;

function MyLeavesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [message, setMessage] = useState("");

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "All" ||
    filters.type !== "All" ||
    filters.startDate !== "" ||
    filters.endDate !== "";

  const [previousFilters, setPreviousFilters] = useState(filters);
  if (filters !== previousFilters) {
    setPreviousFilters(filters);
    setCurrentPage(1);
  }

  const { data: leaveRequestsData, isLoading, isError, error } = useQuery({
    queryKey: ["leave-requests", "me", currentPage],
    queryFn: () => getMyLeaveRequests({ page: currentPage, limit: PAGE_SIZE }),
  });

  const applications = useMemo(() => normalizeLeaveRequestsResponse(leaveRequestsData), [leaveRequestsData]);
  const pagination = leaveRequestsData?.pagination;

  const cancelMutation = useMutation({
    mutationFn: ({ leaveRequestId, reason }) => cancelLeaveRequest(leaveRequestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "me"] });
      setOpenMenuId(null);
      setSelectedApplication(null);
      setMessage("Leave request cancelled successfully.");
    },
    onError: (mutationError) => {
      setMessage(mutationError?.response?.data?.message || "Unable to cancel leave request.");
    },
  });

  // Note: filters only apply to requests already on the current page,
  // since the backend doesn't yet support free-text search or date-range
  // filters as query params. Status/leaveType could be moved server-side
  // later since the backend already accepts them.
  const filteredApplications = useMemo(
    () => applications.filter((application) => applicationMatchesFilters(application, filters)),
    [applications, filters],
  );

  const statusCounts = useMemo(() => {
    return applications.reduce(
      (counts, application) => {
        counts[application.status] = (counts[application.status] || 0) + 1;
        return counts;
      },
      { Pending: 0, Approved: 0, Cancelled: 0 },
    );
  }, [applications]);

  function handleViewDetails(application) {
    setSelectedApplication(application);
    setOpenMenuId(null);
  }

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest("[data-leave-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  function hanldeUpdateFilter(key, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleCancelApplication(applicationId) {
    const confirmed = window.confirm("Are you sure you want to cancel this leave request?");
    if (!confirmed) return;

    cancelMutation.mutate({
      leaveRequestId: applicationId,
      reason: "Cancelled by employee.",
    });
  }

  function handleExportCsv() {
    const rows = filteredApplications.map((application) => ({
      "Leave Type": application.type,
      "Start Date": application.startDate,
      "End Date": application.endDate,
      Days: application.days,
      "Applied On": application.appliedOn,
      Status: application.status,
      Reason: application.reason,
      Remarks: application.remarks || "-",
    }));

    if (!rows.length) {
      setMessage("There are no leave applications to export.");
      return;
    }

    const csvContent = rowsToCsv(rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "my-leave-requests.csv";
    downloadLink.click();

    URL.revokeObjectURL(downloadUrl);
    setMessage("Leave applications exported successfully.");
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-violet-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">
            {error?.response?.data?.message || "Unable to load leave requests."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Leaves</h1>
          <p className="mt-1 text-slate-500">Track your leave applications, statuses, and request history.</p>
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-violet-50"
          onClick={handleExportCsv}
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </header>

      {message && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <span>{message}</span>
          <button type="button" className="font-semibold" onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}

      <Summary statusCounts={statusCounts} />
      <FilterAndSearch applications={applications} filters={filters} onUpdateFilter={hanldeUpdateFilter} onClearFilters={handleClearFilters} />
      <Applications
        filteredApplications={filteredApplications}
        hasActiveFilters={hasActiveFilters}
        pagination={pagination}
        openMenuId={openMenuId}
        currentPage={currentPage}
        handleViewDetails={handleViewDetails}
        cancelMutation={cancelMutation}
        setCurrentPage={setCurrentPage}
        setOpenMenuId={setOpenMenuId}
        handleCancelApplication={handleCancelApplication}
        handleClearFilters={handleClearFilters}
      />

      {selectedApplication && (
        <ApplicationDetailsDialog
          application={selectedApplication}
          isCancelling={cancelMutation.isPending}
          onClose={() => setSelectedApplication(null)}
          onCancel={() => handleCancelApplication(selectedApplication.id)}
        />
      )}
    </div>
  );
}

export default MyLeavesPage;
