import { Info, Users } from "lucide-react";

function TeamAvailabilityCard({ startDate, endDate, workingDays }) {
  const hasSelectedRange = startDate && endDate && workingDays > 0;

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-teal-700" />

        <h2 className="text-xl font-bold text-slate-950">Team Availability</h2>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600">Select dates to see who else might be away during this period.</p>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-slate-600" />

        {hasSelectedRange ? (
          <div>
            <p className="text-sm font-semibold text-slate-800">No conflicts in demo data</p>

            <p className="mt-1 text-sm text-slate-600">Live department availability will come from the API.</p>
          </div>
        ) : (
          <p className="text-sm leading-5 text-slate-600">No dates selected yet. Insight will update automatically.</p>
        )}
      </div>
    </section>
  );
}

export default TeamAvailabilityCard;
