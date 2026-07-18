export default function SettingSelect({ title, subtitle, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      <select
        value={value}
        className="h-10 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
