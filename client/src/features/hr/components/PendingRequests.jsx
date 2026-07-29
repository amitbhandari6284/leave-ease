import { ListFilter } from "lucide-react";
import { Link } from "react-router";

import Requests from "./Requests.jsx";

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

      <div role="table" className="w-full">
        <div
          role="row"
          className="hidden border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600 md:grid md:grid-cols-[28%_32%_25%_15%] md:[&>div]:px-6 md:[&>div]:py-4"
        >
          <div role="columnheader" className="font-semibold">Employee</div>
          <div role="columnheader" className="font-semibold">Leave Details</div>
          <div role="columnheader" className="font-semibold">Duration</div>
          <div role="columnheader" className="text-right font-semibold">Actions</div>
        </div>

        <div role="rowgroup" className="divide-y divide-violet-100">
          {pendingRequests.map((request) => (
            <Requests key={request.id} request={request} variant="dashboard" />
          ))}
        </div>
      </div>

      <footer className="border-t border-violet-200 px-6 py-4 text-center">
        <Link to="/pending-requests" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          View All {dashboardStats[0].value} Pending Requests
        </Link>
      </footer>
    </section>
  );
}
