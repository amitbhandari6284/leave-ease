import { WalletCards } from "lucide-react";

export default function BalanceImpactCard({
  selectedLeaveType,
  selectedBalance,
  workingDays,
  availableBalance,
  balanceAfterRequest,
  balancePercentage,
  hasInsufficientBalance,
  isLoadingBalances,
  isBalancesError,
}) {
  const isUnpaidLeaveType = selectedLeaveType?.isPaid === false;
  const hasTrackedBalance = Boolean(selectedBalance) && !isUnpaidLeaveType;

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <WalletCards className="size-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-950">Balance Impact</h2>
      </div>

      {isLoadingBalances ? (
        <p className="mt-6 rounded-lg bg-violet-50 px-4 py-3 text-sm text-slate-600">Loading balance...</p>
      ) : isBalancesError ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Unable to load balance.</p>
      ) : !selectedLeaveType ? (
        <p className="mt-6 rounded-lg bg-violet-50 px-4 py-3 text-sm text-slate-600">
          Select a leave type to view balance details.
        </p>
      ) : isUnpaidLeaveType ? (
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          This is an unpaid leave type, so paid leave balance will not be deducted.
        </p>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Current Balance</span>
            <strong className="text-xl text-slate-900">
              {hasTrackedBalance ? `${availableBalance} Days` : "Not tracked"}
            </strong>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${hasTrackedBalance ? balancePercentage : 0}%`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-violet-200 pt-4">
            <span className="text-sm text-slate-600">After Request:</span>
            <strong className={balanceAfterRequest != null && balanceAfterRequest < 0 ? "text-red-600" : "text-slate-900"}>
              {!workingDays || !hasTrackedBalance ? "-- Days" : `${balanceAfterRequest} Days`}
            </strong>
          </div>

          {hasInsufficientBalance && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This request exceeds your currently available balance.
            </p>
          )}
        </>
      )}
    </section>
  );
}
