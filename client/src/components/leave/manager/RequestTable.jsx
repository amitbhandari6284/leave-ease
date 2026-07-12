import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import EmployeeDisplay from "./EmployeeDisplay";
import LeaveTypeBadge from "./LeaveTypeBadge";

import { formatDate } from "../../../utils/helper";

function RequestTable({ request }) {
  return (
    <tr className="border-b border-violet-100 text-sm last:border-b-0">
      <td className="px-6 py-5">
        <EmployeeDisplay request={request} />
      </td>

      <td className="px-6 py-5">
        <LeaveTypeBadge type={request.leaveType} />

        <p className="mt-2 text-slate-600">Submitted: {formatDate(request.submittedOn)}</p>
      </td>

      <td className="px-6 py-5">
        <p className="font-semibold text-slate-900">
          {formatDate(request.startDate)} – {formatDate(request.endDate)}
        </p>

        <p className="mt-1 text-slate-600">
          {request.days} Days
          {request.hasDocument && " · Medical document attached"}
        </p>
      </td>

      <td className="px-6 py-5 text-right">
        <Link
          to={`/review-request/${request.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Review
          <ArrowUpRight className="size-4" />
        </Link>
      </td>
    </tr>
  );
}

export default RequestTable;
