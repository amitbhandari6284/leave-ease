import { formatDateRange, formatDate } from "../../../utils/helper.js";
import ReviewLink from "./ReviewLink.jsx";
import AttentionBadge from "./AttentionBadge.jsx";
import Employee from "./Employee.jsx"


export default function RequestRow({ request }) {
  return (
    <tr className="border-b border-violet-100 text-sm last:border-b-0">
      <td className="px-6 py-5 align-middle">
        <Employee request={request} />
      </td>

      <td className="whitespace-nowrap px-6 py-5 align-middle font-medium text-slate-800">
        {request.leaveType}
      </td>

      <td className="px-6 py-5 align-middle">
        <p className="whitespace-nowrap font-medium text-slate-900">
          {formatDateRange(request.startDate, request.endDate)}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {request.days} {request.days === 1 ? "day" : "days"}
        </p>
      </td>

      <td className="whitespace-nowrap px-6 py-5 align-middle text-slate-600">
        {formatDate(request.submittedOn)}
      </td>

      <td className="px-6 py-5 align-middle">
        <AttentionBadge request={request} />
      </td>

      <td className="whitespace-nowrap px-6 py-5 text-right align-middle">
        <ReviewLink requestId={request.id} />
      </td>
    </tr>
  );
}

