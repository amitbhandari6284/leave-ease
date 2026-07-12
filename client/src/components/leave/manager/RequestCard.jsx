import { Link } from "react-router";

import LeaveTypeBadge from "./LeaveTypeBadge";
import EmployeeDisplay from "./EmployeeDisplay";

import { formatDate } from "../../../utils/helper";

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
        to={`/review-request/${request.id}`}
        className="mt-5 flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Review Request
      </Link>
    </article>
  );
}

export default RequestCard;
