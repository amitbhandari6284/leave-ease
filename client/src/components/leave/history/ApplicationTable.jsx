import { EllipsisVertical } from "lucide-react";

import { formatDate } from "../../../utils/helper";

import LeaveTypeDisplay from "./LeaveTypeDisplay";
import StatusBadge from "./StatusBadge";

function ApplicationTable({ application, isMenuOpen, onToggleMenu, onCancel, openUpward }) {
  return (
    <tr className="border-b border-violet-100 text-sm last:border-b-0">
      <td className="px-6 py-5">
        <LeaveTypeDisplay type={application.type} />
      </td>

      <td className="px-6 py-5 text-slate-700">
        {formatDate(application.startDate)} – {formatDate(application.endDate)}
      </td>

      <td className="px-6 py-5 font-medium text-slate-800">{application.days}</td>

      <td className="px-6 py-5 text-slate-600">{formatDate(application.appliedOn)}</td>

      <td className="px-6 py-5">
        <StatusBadge status={application.status} />
      </td>

      <td className="relative px-6 py-5 text-right">
        <button
          type="button"
          aria-label={`Actions for ${application.type}`}
          aria-expanded={isMenuOpen}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
          onClick={onToggleMenu}
        >
          <EllipsisVertical className="size-5" />
        </button>

        {isMenuOpen && (
          <div
            className={`absolute right-6 z-20 w-40 rounded-lg border border-violet-200 bg-white p-1 text-left shadow-lg ${
              openUpward ? "bottom-14" : "top-14"
            }`}
          >
            <button type="button" className="w-full rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              View details
            </button>

            {application.status === "Pending" && (
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={onCancel}
              >
                Cancel request
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default ApplicationTable;
