import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import EmptyState from "../../components/ui/EmptyState.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SummaryCard from "../../components/ui/SummaryCard.jsx";

import Requests from "../../features/hr/components/Requests.jsx";
import ReviewRequestDrawer from "../../features/hr/components/ReviewRequestDrawer.jsx";
import { normalizeReviewQueueResponse } from "../../features/hr/utils/normalize.js";
import { decideLeaveRequest, getReviewQueue } from "../../features/leave/utils/leaveApi.js";

const STATUS_TABS = ["All", "Pending", "Approved", "Rejected", "Cancelled"];
const PAGE_SIZE = 10;

function PendingRequestsPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("All");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const [previousStatusTab, setPreviousStatusTab] = useState(statusTab);
  if (statusTab !== previousStatusTab) {
    setPreviousStatusTab(statusTab);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["leave-requests", "review-queue", statusTab, page],
    queryFn: () =>
      getReviewQueue({
        ...(statusTab !== "All" && { status: statusTab }),
        page,
        limit: PAGE_SIZE,
      }),
  });

  const requests = useMemo(() => {
    const normalized = normalizeReviewQueueResponse(data);
    return [...normalized].sort((a, b) => {
      const dateA = new Date(a.submittedOn);
      const dateB = new Date(b.submittedOn);
      return dateB - dateA; // Descending order
    });
  }, [data]);
  const pagination = data?.pagination;

  const decisionMutation = useMutation({
    mutationFn: ({ leaveRequestId, payload }) => decideLeaveRequest(leaveRequestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "me"] });
    },
  });

  const selectedRequest = requests.find((r) => r.id === requestId);
  const pendingCountOnPage = requests.filter((r) => r.status === "Pending").length;
  const requiresAttention = requests.filter((r) => r.status === "Pending" && (r.conflicts.length > 0 || r.hasDocument)).length;

  // Note: search only filters requests already on the current page,
  // since free-text search isn't supported by the backend yet.
  const filteredRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return requests;
    return requests.filter((r) =>
      [r.employee, r.department, r.leaveType, r.status].some((field) => field.toLowerCase().includes(search)),
    );
  }, [requests, searchTerm]);

  useEffect(() => {
    if (!requestId) return undefined;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [requestId]);

  function closeDrawer() {
    navigate("/pending-requests");
  }

  async function decide(id, decision, remark) {
    const verb = decision === "APPROVED" ? "approved" : "rejected";
    try {
      await decisionMutation.mutateAsync({ leaveRequestId: id, payload: { decision, remark } });
      setMessage(`Leave request ${verb} successfully.`);
      closeDrawer();
    } catch (err) {
      setMessage(err.response?.data?.message || `Unable to ${decision === "APPROVED" ? "approve" : "reject"} leave request.`);
    }
  }

  const approveRequest = (id) => decide(id, "APPROVED", "Approved by HR.");
  const rejectRequest = (id, remarks) => decide(id, "REJECTED", remarks);

  if (isLoading) return <StatusPanel text="Loading leave requests..." />;
  if (isError) return <StatusPanel text={error?.response?.data?.message || "Unable to load leave requests."} isError />;

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Leave Requests</h1>
        <p className="mt-1 text-slate-500">
          Review pending applications and view approved, rejected, or cancelled history.
        </p>
      </header>

      {message && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <span>{message}</span>
          <button type="button" className="font-semibold" onClick={() => setMessage("")}>Dismiss</button>
        </div>
      )}

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        <SummaryCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600">Pending (this page)</p>
              <p className="mt-4 text-4xl font-bold text-slate-950">{pendingCountOnPage}</p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Clock3 className="size-5" />
            </div>
          </div>
        </SummaryCard>

        <SummaryCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600">Requires Attention</p>
              <p className="mt-4 text-4xl font-bold text-slate-950">{requiresAttention}</p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </SummaryCard>
      </section>

      <section className="mt-6 rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            placeholder="Search this page (employee, department, leave type, status)..."
            className={inputClass}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusTab === status ? "bg-indigo-600 text-white" : "border border-violet-200 bg-white text-slate-600 hover:bg-violet-50"
              }`}
            onClick={() => setStatusTab(status)}
          >
            {status}
          </button>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
        <header className="border-b border-violet-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">Request Records</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pending requests can be reviewed. Completed requests are available for history.
          </p>
        </header>

        <div role="table" className="w-full">
          <div
            role="row"
            className="hidden border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600 md:grid md:grid-cols-[24%_15%_25%_13%_11%_12%] md:[&>div]:px-6 md:[&>div]:py-4"
          >
            <div role="columnheader" className="font-semibold">Employee</div>
            <div role="columnheader" className="font-semibold">Leave Type</div>
            <div role="columnheader" className="font-semibold">Duration</div>
            <div role="columnheader" className="font-semibold">Submitted</div>
            <div role="columnheader" className="font-semibold">Status</div>
            <div role="columnheader" className="text-right font-semibold">Action</div>
          </div>

          <div role="rowgroup" className="divide-y divide-violet-100">
            {filteredRequests.map((request) => (
              <Requests key={request.id} request={request} />
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 && (
          <EmptyState title="No leave requests found" message="Try changing the selected filters or status tab." />
        )}

        {pagination && pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t border-violet-200 px-6 py-4">
            <p className="text-sm text-slate-600">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRequests} total)
            </p>
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />
          </footer>
        )}
      </section>

      <ReviewRequestDrawer request={selectedRequest} onClose={closeDrawer} onApprove={approveRequest} onReject={rejectRequest} />
    </div>
  );
}

function StatusPanel({ text, isError }) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className={`rounded-xl border px-6 py-10 text-center shadow-sm ${isError ? "border-red-200 bg-red-50" : "border-violet-200 bg-white"}`}>
        <p className={`text-sm font-semibold ${isError ? "text-red-700" : "text-slate-700"}`}>{text}</p>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

export default PendingRequestsPage;
