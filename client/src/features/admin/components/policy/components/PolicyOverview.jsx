export default function PolicyOverview({ activePolicies, totalPolicies }) {
  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">Policy Overview</h2>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-medium text-slate-600">
            Active Policies
          </p>

          <p className="mt-2 text-4xl font-bold text-indigo-600">
            {activePolicies}
          </p>
        </div>

        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-medium text-slate-600">Total Types</p>

          <p className="mt-2 text-4xl font-bold text-slate-950">
            {totalPolicies}
          </p>
        </div>
      </div>
    </section>
  );
}
