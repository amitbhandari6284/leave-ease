export default function FormField({ label, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
      </label>

      {children}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
