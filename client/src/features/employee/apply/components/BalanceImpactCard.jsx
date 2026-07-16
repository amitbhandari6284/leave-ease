import { WalletCards } from "lucide-react";

export default function BalanceImpactCard({ selectedLeaveType, workingDays, balanceAfterRequest, balancePercentage }) {
  const hasLimitedBalance = selectedLeaveType?.currentBalance != null;

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <WalletCards className="size-5 text-indigo-600" />

        <h2 className="text-xl font-bold text-slate-950">Balance Impact</h2>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">Current Balance</span>

        <strong className="text-xl text-slate-900">
          {!selectedLeaveType ? "-- Days" : hasLimitedBalance ? `${selectedLeaveType.currentBalance} Days` : "Not limited"}
        </strong>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{
            width: `${selectedLeaveType ? balancePercentage : 0}%`,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-violet-200 pt-4">
        <span className="text-sm text-slate-600">After Request:</span>

        <strong className={balanceAfterRequest != null && balanceAfterRequest < 0 ? "text-red-600" : "text-slate-900"}>
          {!selectedLeaveType || !workingDays ? "-- Days" : hasLimitedBalance ? `${balanceAfterRequest} Days` : "Not limited"}
        </strong>
      </div>
    </section>
  );
}

