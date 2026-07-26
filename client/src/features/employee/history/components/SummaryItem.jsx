function SummaryItem({ label, value, description, icon: Icon, iconClass }) {
  return (
    <article className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-4 text-4xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className={`flex size-11 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

export default SummaryItem;
