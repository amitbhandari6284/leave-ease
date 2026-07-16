import { ListFilter } from "lucide-react";
import { Link } from "react-router";

import EmployeeDisplay from "./Employee.jsx";
import LeaveTypeBadge from "./LeaveTypeBadge.jsx";

import { formatDate } from "../../../lib/helper.js";
import RequestTable from "./RequestTable.jsx";


export default function PendingRequests({ pendingRequests, dashboardStats }) {
  return (
    <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-violet-200 px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Pending Leave Requests</h2>

          <p className="mt-1 text-sm text-slate-500">Requires manager or HR review</p>
        </div>

        <button type="button" aria-label="Filter pending requests" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
          <ListFilter className="size-5" />
        </button>
      </header>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-180 border-collapse text-left">
          <thead>
            <tr className="border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600">
              <th className="px-6 py-4 font-semibold">Employee</th>
              <th className="px-6 py-4 font-semibold">Leave Details</th>
              <th className="px-6 py-4 font-semibold">Duration</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pendingRequests.map((request) => (
              <RequestTable key={request.id} request={request} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-violet-100 md:hidden">
        {pendingRequests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>

      <footer className="border-t border-violet-200 px-6 py-4 text-center">
        <Link to="/pending-requests" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          View All {dashboardStats[0].value} Pending Requests
        </Link>
      </footer>
    </section>
  );
}



function RequestCard({ request }) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <EmployeeDisplay request={request} />
        <LeaveTypeBadge type={request.leaveType} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Duration</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatDate(request.startDate)} – {formatDate(request.endDate)}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Days</dt>
          <dd className="mt-1 font-semibold text-slate-900">{request.days}</dd>
        </div>

        <div>
          <dt className="text-slate-500">Submitted</dt>
          <dd className="mt-1 font-semibold text-slate-900">{formatDate(request.submittedOn)}</dd>
        </div>

        <div>
          <dt className="text-slate-500">Document</dt>
          <dd className="mt-1 font-semibold text-slate-900">{request.hasDocument ? "Attached" : "None"}</dd>
        </div>
      </dl>

      <Link
        to={`/pending-requests/${request.id}`}
        className="mt-5 flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Review Request
      </Link>
    </article>
  );
}

