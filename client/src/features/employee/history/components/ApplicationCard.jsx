import LeaveTypeDisplay from "./LeaveTypeDisplay";
import StatusBadge from "../../../../components/ui/StatusBadge";

import { formatDate } from "../../../../lib/helper.js";

function ApplicationCard({ application, onCancel }) {
  const statusBadegeClassName = application.status === "Approved" ? "bg-emerald-100 text-emerald-700" : application.status == "Pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <LeaveTypeDisplay type={application.type} />

        <StatusBadge className={statusBadegeClassName} status={application.status} />
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

export default ApplicationCard;
