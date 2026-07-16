import { Users } from "lucide-react";

const departmentAvailability = [
  {
    department: "Engineering",
    present: 42,
    total: 45,
    barClass: "bg-indigo-600",
  },
  {
    department: "Marketing",
    present: 18,
    total: 24,
    barClass: "bg-orange-700",
  },
  {
    department: "Sales",
    present: 30,
    total: 32,
    barClass: "bg-teal-700",
  },
];

function AvailabilityCard() {
  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-950">Availability Today</h2>

        <Users className="size-5 text-slate-600" />
      </div>

      <div className="mt-6 space-y-5">
        {departmentAvailability.map((department) => {
          const percentage = (department.present / department.total) * 100;

          return (
            <div key={department.department}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-slate-800">{department.department}</span>

                <span className="text-slate-600">
                  {department.present}/{department.total} Present
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                <div className={`h-full rounded-full ${department.barClass}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AvailabilityCard;
