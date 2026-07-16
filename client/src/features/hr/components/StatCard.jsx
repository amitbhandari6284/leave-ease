import { TrendingUp } from "lucide-react";

function StatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <article className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">{stat.label}</p>

        <div className={`flex size-10 items-center justify-center rounded-full ${stat.iconClass}`}>
          <Icon className="size-5" />
        </div>
      </div>

      <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">{stat.value}</p>

      <p className={`mt-2 flex items-center gap-1 text-xs ${stat.descriptionClass}`}>
        {stat.description.startsWith("+") && <TrendingUp className="size-3.5" />}

        {stat.description}
      </p>
    </article>
  );
}

export default StatCard;
