import { EllipsisVertical, Eye, XCircle } from "lucide-react";

import { canCancelApplication, formatDate, formatDateRange } from "../../utils/helper.js";

import LeaveTypeDisplay from "./LeaveTypeDisplay.jsx";
import StatusBadge from "./StatusBadge.jsx";

// Shared column widths so the header row (rendered by the page) and each
// item row always stay aligned. Import this alongside ApplicationItem.
export const GRID_COLUMNS = "md:grid-cols-[2fr_1.4fr_0.7fr_1fr_0.9fr_0.6fr]";

function ApplicationItem({
  application,
  isMenuOpen,
  openUpward,
  isCancelling,
  allowCancel = true,
  onToggleMenu,
  onViewDetails,
  onCancel,
}) {
  const canCancel = allowCancel && canCancelApplication(application.status);

  return (
    <div
      role="row"
      className={`grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-sm md:items-center md:gap-4 md:px-6 md:py-5 ${GRID_COLUMNS}`}
    >
      <div role="cell" className="col-span-2 md:col-span-1">
        <LeaveTypeDisplay type={application.type} />
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{application.reason}</p>
      </div>

      <Field label="Duration">{formatDateRange(application.startDate, application.endDate)}</Field>
      <Field label="Days">{application.days}</Field>
      <Field label="Applied On">{formatDate(application.appliedOn)}</Field>
      <Field label="Status">
        <StatusBadge status={application.status} />
      </Field>

      <div role="cell" className="col-span-2 flex items-center gap-3 md:col-span-1 md:justify-end" data-leave-menu>
        {/* Mobile: actions shown inline as buttons */}
        <button
          type="button"
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white text-sm font-semibold text-slate-700 hover:bg-violet-50 md:hidden"
          onClick={onViewDetails}
        >
          <Eye className="size-4" />
          View
        </button>

        {canCancel && (
          <button
            type="button"
            disabled={isCancelling}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
            onClick={onCancel}
          >
            <XCircle className="size-4" />
            Cancel
          </button>
        )}

        {/* Desktop: actions collapse into a menu, matching table row density */}
        <div className="relative hidden md:block">
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
              className={`absolute right-0 z-20 w-40 rounded-lg border border-violet-200 bg-white p-1 text-left shadow-lg ${openUpward ? "bottom-11" : "top-11"
                }`}
            >
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={onViewDetails}
              >
                View details
              </button>

              {canCancel && (
                <button
                  type="button"
                  disabled={isCancelling}
                  className="w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onCancel}
                >
                  Cancel request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div role="cell">
      <p className="text-xs font-medium text-slate-500 md:hidden">{label}</p>
      <div className="mt-0.5 font-medium text-slate-800 md:mt-0 md:font-normal md:text-slate-700">{children}</div>
    </div>
  );
}

export default ApplicationItem;
