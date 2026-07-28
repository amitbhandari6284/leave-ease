import { Info } from "lucide-react";

export default function PolicyHelpCard({ selectedLeaveType }) {
  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="size-5 text-indigo-600" />

        <h2 className="text-xl font-bold text-slate-950">Policy Details</h2>
      </div>

      {!selectedLeaveType ? (
        <p className="mt-5 text-sm leading-6 text-slate-500">Select a leave type to view policy details.</p>
      ) : (
        <div className="mt-5 space-y-4 text-sm">
          <InfoRow label="Paid leave" value={selectedLeaveType.isPaid ? "Yes" : "No"} />

          <InfoRow label="Yearly allowance" value={`${selectedLeaveType.yearlyAllowance} day(s)`} />

          <InfoRow label="Half day allowed" value={selectedLeaveType.allowHalfDay ? "Yes" : "No"} />

          <InfoRow
            label="Max consecutive"
            value={selectedLeaveType.maxConsecutiveDays ? `${selectedLeaveType.maxConsecutiveDays} day(s)` : "Not set"}
          />

          <InfoRow label="Document required" value={selectedLeaveType.requiresDocument ? "Yes" : "No"} />
        </div>
      )}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <strong className="text-right text-slate-900">{value}</strong>
    </div>
  );
}
