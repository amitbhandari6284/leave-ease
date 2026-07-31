import { BadgeIndianRupee, CalendarOff, Plane, Stethoscope } from "lucide-react";

const leaveCodeMap = {
  CL: { icon: Plane, iconClass: "bg-indigo-50 text-indigo-600", progressClass: "bg-indigo-600", },
  SL: { icon: Stethoscope, iconClass: "bg-teal-50 text-teal-700", progressClass: "bg-teal-700", },
  EL: { icon: BadgeIndianRupee, iconClass: "bg-orange-100 text-amber-800", progressClass: "bg-amber-800", },
  UL: { icon: CalendarOff, iconClass: "bg-violet-50 text-slate-500", progressClass: "bg-slate-500", },
};

export function LeaveBalanceCard({ leave }) {
  const { icon: Icon, iconClass, progressClass } = leaveCodeMap[leave.leaveTypeCode]
  const progress = ((leave.used / leave.total).toFixed(2)) * 100

  return (
    <article className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">{leave.leaveTypeName}</p>
        <div className={`flex size-9 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight text-slate-950">{leave.available}</span>
        <span className="pb-1 text-sm text-slate-600">Days Remaining</span>
      </div>

      <div className="mt-5 flex justify-between text-xs text-slate-600">
        <span>Used: {leave.used}</span>
        <span>Total: {leave.total}</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
        <div className={`h-full rounded-full ${progressClass}`} style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}
