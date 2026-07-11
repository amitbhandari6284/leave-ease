import { CalendarDays, FileText, HeartPulse, Umbrella, WalletCards } from "lucide-react";

const leaveTypeConfig = {
  "Casual Leave": {
    icon: Umbrella,
    className: "bg-indigo-50 text-indigo-600",
  },
  "Sick Leave": {
    icon: HeartPulse,
    className: "bg-teal-50 text-teal-700",
  },
  "Earned Leave": {
    icon: WalletCards,
    className: "bg-amber-50 text-amber-700",
  },
  "Unpaid Leave": {
    icon: CalendarDays,
    className: "bg-slate-100 text-slate-600",
  },
};

function LeaveTypeDisplay({ type }) {
  const config = leaveTypeConfig[type] ?? {
    icon: FileText,
    className: "bg-slate-100 text-slate-600",
  };

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config.className}`}>
        <Icon className="size-4" />
      </div>

      <span className="font-semibold text-slate-900">{type}</span>
    </div>
  );
}

export default LeaveTypeDisplay;
