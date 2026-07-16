import { useEffect, useState } from "react";
import { AlertTriangle, Building2, Clock3, FileText, Info, Plane, X } from "lucide-react";

function ReviewRequestDrawer({ request, onClose, onApprove, onReject }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    setIsRejecting(false);
    setRemarks("");
  }, [request?.id]);

  if (!request) return null;

  const balanceAfterApproval = request.currentBalance - request.days;
  const balancePercentage = (request.currentBalance / request.totalBalance) * 100;

  function handleReject() {
    if (!remarks.trim()) return;

    onReject(request.id, remarks.trim());
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-request-title"
        className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-violet-200 px-6">
          <h2 id="review-request-title" className="text-xl font-bold text-slate-950">
            Review Leave Request
          </h2>

          <button
            type="button"
            aria-label="Close review request"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-7">
          <EmployeeDetails request={request} />

          <div className="mt-7 grid grid-cols-2 gap-4">
            <SummaryCard label="Leave Type" value={request.leaveType} icon={Plane} />

            <SummaryCard label="Duration" value={`${request.days} Days`} icon={Clock3} />
          </div>

          <SectionTitle>Request Details</SectionTitle>

          <section className="overflow-hidden rounded-lg border border-violet-200">
            <DetailRow label="Start Date" value={formatDate(request.startDate)} />

            <DetailRow label="End Date" value={formatDate(request.endDate)} />

            <div className="border-t border-violet-200 p-4">
              <p className="text-sm text-slate-600">Reason Provided</p>

              <p className="mt-3 rounded-md bg-violet-50 p-4 text-sm leading-6 text-slate-800">“{request.reason}”</p>
            </div>
          </section>

          {request.hasDocument && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-violet-200 p-4">
              <FileText className="size-5 text-indigo-600" />

              <div>
                <p className="text-sm font-semibold text-slate-900">Supporting document attached</p>

                <button type="button" className="mt-1 text-sm font-medium text-indigo-600">
                  View document
                </button>
              </div>
            </div>
          )}

          <SectionTitle>Balance Impact</SectionTitle>

          <section className="rounded-lg border border-violet-200 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-800">{request.leaveType} Balance</span>

              <span className="text-slate-600">
                <strong className="text-indigo-600">{request.currentBalance}</strong> / {request.totalBalance} Days
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${balancePercentage}%` }} />
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs text-slate-600">
              <Info className="mt-0.5 size-4 shrink-0" />
              Approving will reduce the balance to {balanceAfterApproval} days.
            </p>
          </section>

          <SectionTitle>Team Coverage</SectionTitle>

          {request.conflicts.length > 0 ? (
            <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

                <div className="min-w-0">
                  <p className="font-semibold text-amber-700">{request.conflicts.length} Potential Conflict</p>

                  <p className="mt-1 text-sm text-amber-700">Another team member is scheduled off during this period.</p>

                  <div className="mt-3 space-y-2">
                    {request.conflicts.map((conflict) => (
                      <div
                        key={`${conflict.employee}-${conflict.date}`}
                        className="flex items-center gap-3 rounded-md bg-white p-3"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {conflict.initials}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">{conflict.employee}</p>

                          <p className="text-xs text-slate-500">Away on {formatDate(conflict.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">No team coverage conflicts found.</p>
            </section>
          )}

          {isRejecting && (
            <section className="mt-6">
              <label htmlFor="rejectionRemarks" className="text-sm font-semibold text-slate-900">
                Rejection remarks
              </label>

              <textarea
                id="rejectionRemarks"
                rows="4"
                value={remarks}
                placeholder="Explain why this request is being rejected..."
                className="mt-2 w-full rounded-lg border border-violet-200 bg-violet-50/40 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
                onChange={(event) => setRemarks(event.target.value)}
              />

              {!remarks.trim() && <p className="mt-1 text-xs text-slate-500">Remarks are required before rejecting a request.</p>}
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-violet-200 bg-white px-6 py-5">
          {isRejecting ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="h-11 flex-1 rounded-lg border border-violet-200 font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setIsRejecting(false);
                  setRemarks("");
                }}
              >
                Back
              </button>

              <button
                type="button"
                disabled={!remarks.trim()}
                className="h-11 flex-1 rounded-lg bg-red-600 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleReject}
              >
                Confirm Rejection
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="h-11 rounded-lg border border-red-500 px-6 font-semibold text-red-600 hover:bg-red-50"
                onClick={() => setIsRejecting(true)}
              >
                Reject
              </button>

              <button
                type="button"
                className="h-11 rounded-lg bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700"
                onClick={() => onApprove(request.id)}
              >
                Approve Request
              </button>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}

function EmployeeDetails({ request }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
        {request.initials}
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-950">{request.employee}</h3>

        <p className="mt-1 text-sm text-slate-600">{request.designation}</p>

        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <Building2 className="size-3.5" />
          {request.department}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      <p className="text-sm text-slate-600">{label}</p>

      <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
        <Icon className="size-4 text-indigo-600" />
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-violet-200 px-4 py-4 first:border-t-0">
      <span className="text-sm text-slate-600">{label}</span>
      <strong className="text-sm text-slate-900">{value}</strong>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">{children}</h3>;
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default ReviewRequestDrawer;
