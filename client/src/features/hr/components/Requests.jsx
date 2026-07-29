import { formatDateRange, formatDate } from "../../../lib/helper.js";
import Employee from "./Employee.jsx";
import LeaveTypeBadge from "./LeaveTypeBadge.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import ReviewLink from "./ReviewLink.jsx";

const PAGE_COLS = "md:grid-cols-[24%_15%_25%_13%_11%_12%]";
const DASHBOARD_COLS = "md:grid-cols-[28%_32%_25%_15%]";

export default function RequestRow({ request, variant = "page" }) {
  const isDashboard = variant === "dashboard";

  return (
    <div
      role="row"
      className={`grid grid-cols-1 gap-3 p-5 text-sm md:items-center md:gap-0 md:p-0 md:[&>div]:px-6 md:[&>div]:py-5 ${isDashboard ? DASHBOARD_COLS : PAGE_COLS}`}
    >
      <div role="cell">
        <Employee request={request} />
      </div>

      {isDashboard ? (
        <div role="cell">
          <LeaveTypeBadge type={request.leaveType} />
          <p className="mt-2 text-slate-600">Submitted: {formatDate(request.submittedOn)}</p>
        </div>
      ) : (
        <div role="cell" className="font-medium text-slate-800 md:whitespace-nowrap">
          {request.leaveType}
        </div>
      )}

      <div role="cell">
        <p className="font-medium text-slate-900 md:whitespace-nowrap">
          {formatDateRange(request.startDate, request.endDate)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {request.days} {request.days === 1 ? "day" : "days"}
          {isDashboard && request.hasDocument && " · Medical document attached"}
        </p>
      </div>

      {!isDashboard && (
        <div role="cell" className="text-slate-600 md:whitespace-nowrap">
          {formatDate(request.submittedOn)}
        </div>
      )}

      {!isDashboard && (
        <div role="cell">
          <StatusBadge status={request.status} />
        </div>
      )}

      <div role="cell" className="md:text-right">
        <ReviewLink request={request} />
      </div>
    </div>
  );
}
