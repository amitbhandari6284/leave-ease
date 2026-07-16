import { formatDate } from "../../../lib/helper.js";
import Employee from "./Employee";
import AttentionBadge from "./AttentionBadge";
import ReviewLink from "./ReviewLink";

export default function RequestCard({ request }) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <Employee request={request} />
        <AttentionBadge request={request} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Leave type</dt>
          <dd className="mt-1 font-semibold text-slate-900">{request.leaveType}</dd>
        </div>

        <div>
          <dt className="text-slate-500">Days</dt>
          <dd className="mt-1 font-semibold text-slate-900">{request.days}</dd>
        </div>

        <div className="col-span-2">
          <dt className="text-slate-500">Duration</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatDate(request.startDate)} – {formatDate(request.endDate)}
          </dd>
        </div>
      </dl>

      <ReviewLink requestId={request.id} fullWidth />
    </article>
  );
}

