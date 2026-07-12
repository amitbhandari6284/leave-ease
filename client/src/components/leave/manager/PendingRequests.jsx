import { ListFilter } from "lucide-react";
import { Link } from "react-router";

import RequestTable from "./RequestTable";
import RequestCard from "./RequestCard";

function PendingRequests({ pendingRequests, dashboardStats }) {
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
        <table className="w-full min-w-[720px] border-collapse text-left">
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

export default PendingRequests;
