import { CalendarDays, FileText, XCircle } from "lucide-react";
import SummaryItem from "./SummaryItem";

export default function Summary({ statusCounts }) {
  return (
    <section className="mt-8 grid gap-5 sm:grid-cols-3">
      <SummaryItem
        label="Pending"
        value={statusCounts.Pending}
        description="Awaiting approval"
        icon={CalendarDays}
        iconClass="bg-amber-100 text-amber-700"
      />
      <SummaryItem
        label="Approved"
        value={statusCounts.Approved}
        description="Approved requests"
        icon={FileText}
        iconClass="bg-emerald-100 text-emerald-700"
      />
      <SummaryItem
        label="Cancelled"
        value={statusCounts.Cancelled}
        description="Cancelled requests"
        icon={XCircle}
        iconClass="bg-slate-100 text-slate-600"
      />
    </section>
  )
}

