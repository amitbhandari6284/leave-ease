import { FileText, X } from "lucide-react";

import { canCancelApplication, formatDate } from "../../utils/helper.js";

import StatusBadge from "./StatusBadge.jsx";

function ApplicationDetailsDialog({ application, isCancelling, allowCancel = true, onClose, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-violet-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase">Leave Details</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{application.type}</h2>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close details"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={application.status} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {application.days} {application.days === 1 ? "day" : "days"}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Start Date" value={formatDate(application.startDate)} />
            <DetailItem label="End Date" value={formatDate(application.endDate)} />
            <DetailItem label="Applied On" value={formatDate(application.appliedOn)} />
            <DetailItem label="Leave Type" value={application.type} />
          </dl>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Reason</h3>
            <p className="mt-2 rounded-lg bg-violet-50/60 px-4 py-3 text-sm leading-6 text-slate-700">
              {application.reason}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">HR Remarks</h3>
            <p className="mt-2 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              {application.remarks || "No remarks added yet."}
            </p>
          </div>

          {application.documentUrl && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Attached Document</h3>
              <a
                href={application.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <FileText className="size-4" />
                View document
              </a>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-violet-200 px-6 py-5">
          <button
            type="button"
            className="h-11 rounded-lg border border-violet-200 px-5 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>

          {allowCancel && canCancelApplication(application.status) && (
            <button
              type="button"
              disabled={isCancelling}
              className="h-11 rounded-lg bg-red-600 px-5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onCancel}
            >
              {isCancelling ? "Cancelling..." : "Cancel Request"}
            </button>
          )}
        </footer>
      </article>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-violet-100 bg-white px-4 py-3">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default ApplicationDetailsDialog;
