import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { initialLeaveRequests } from "../../data/hrRequests";
import RequestRow from "../../features/hr/components/RequestRow.jsx";
import RequestCard from "../../features/hr/components/RequestCard.jsx";
import ReviewRequestDrawer from "../../features/hr/components/ReviewRequestDrawer.jsx";
import SummaryCard from "../../components/ui/SummaryCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

function PendingRequestsPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [requests, setRequests] = useState(initialLeaveRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [statusTab, setStatusTab] = useState("All");

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending",
  );
  const selectedRequest = requests.find((request) => request.id === requestId);
  const departments = [...new Set(pendingRequests.map((request) => request.department))];
  const leaveTypes = [...new Set(pendingRequests.map((request) => request.leaveType))];
  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        request.employee.toLowerCase().includes(normalizedSearch) ||
        request.department.toLowerCase().includes(normalizedSearch) ||
        request.leaveType.toLowerCase().includes(normalizedSearch);

      const matchesDepartment = departmentFilter === "All" || request.department === departmentFilter;
      const matchesLeaveType = leaveTypeFilter === "All" || request.leaveType === leaveTypeFilter;
      const matchesStatusTab = statusTab === "All" || request.status === statusTab;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesLeaveType &&
        matchesStatusTab
      );
    });
  }, [requests, searchTerm, departmentFilter, leaveTypeFilter, statusTab]);

  const requiresAttention = pendingRequests.filter((request) => request.conflicts.length > 0 || request.hasDocument).length;

  useEffect(() => {
    if (!requestId) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [requestId]);

  function closeDrawer() {
    navigate("/pending-requests");
  }
  // it's bad tell me about
  function approveRequest(id) {
    setRequests((currentRequests) =>
      currentRequests.map((request) => (request.id === id ? { ...request, status: "Approved" } : request)),
    );

    setMessage("Leave request approved successfully.");
    closeDrawer();
  }

  function rejectRequest(id, remarks) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id
          ? {
            ...request,
            status: "Rejected",
            decisionRemarks: remarks,
          }
          : request,
      ),
    );

    setMessage("Leave request rejected successfully.");
    closeDrawer();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Leave Requests </h1>
        <p className="mt-1 text-slate-500"> Review pending applications and view approved, rejected, or cancelled history. </p>
      </header>

      {message && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <span>{message}</span>

          <button type="button" className="font-semibold" onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        <SummaryCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600">Total Pending</p>
              <p className="mt-4 text-4xl font-bold text-slate-950">{pendingRequests.length}</p>
            </div>
            <div className={`flex size-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-600`}>
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
            <div className={`flex size-11 items-center justify-center rounded-full  bg-amber-100 text-amber-700`}>
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </SummaryCard>
      </section>

      <section className="mt-6 rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative md:col-span-2 xl:col-span-6">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchTerm}
              placeholder="Search employees or requests..."
              className={inputClass}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={departmentFilter}
            className={`${selectClass} xl:col-span-3`}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="All">All Departments</option>

            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={leaveTypeFilter}
            className={`${selectClass} xl:col-span-3`}
            onChange={(event) => setLeaveTypeFilter(event.target.value)}
          >
            <option value="All">All Leave Types</option>

            {leaveTypes.map((leaveType) => (
              <option key={leaveType} value={leaveType}>
                {leaveType}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {["All", "Pending", "Approved", "Rejected", "Cancelled"].map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusTab === status
              ? "bg-indigo-600 text-white"
              : "border border-violet-200 bg-white text-slate-600 hover:bg-violet-50"
              }`}
            onClick={() => setStatusTab(status)}
          >
            {status}
          </button>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
        <header className="border-b border-violet-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950"> Request Records </h2>
          <p className="mt-1 text-sm text-slate-500"> Pending requests can be reviewed. Completed requests are available for history. </p>
        </header>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-262.5 table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[15%]" />
              <col className="w-[25%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600">
                <th className="whitespace-nowrap pl-14 py-4 font-semibold">Employee</th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">Leave Type</th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">Duration</th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">Submitted</th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">Status</th>
                <th className="whitespace-nowrap pr-14 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-violet-100 md:hidden">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>

        {filteredRequests.length === 0 && <EmptyState title="No pending requests found"
          message="Try changing the selected filters." />}
      </section>

      <ReviewRequestDrawer request={selectedRequest} onClose={closeDrawer} onApprove={approveRequest} onReject={rejectRequest} />
    </div>
  );
}


const inputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

const selectClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

export default PendingRequestsPage;
