import { formatDateRange, formatDate } from "../../../lib/helper.js";
import ReviewLink from "./ReviewLink.jsx";
import Employee from "./Employee.jsx"
import StatusBadge from "../../../components/ui/StatusBadge.jsx";


export default function RequestRow({ request }) {
  const statusBadegeClassName = (request.status == "Pending" ? "bg-amber-100 text-amber-700"
    : request.status == "Approved" ? "bg-emerald-100 text-emerald-700"
      : request.status === "Rejected" ? "bg-red-100 text-red-700"
        : "")
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
        <StatusBadge className={statusBadegeClassName} status={request.status} />
      </td>

      <td className="whitespace-nowrap px-6 py-5 text-right align-middle">
        <ReviewLink request={request} />
      </td>
    </tr>
  );
}

