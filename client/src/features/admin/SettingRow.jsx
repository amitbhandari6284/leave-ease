export default function SettingRow({ title, subtitle, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}
