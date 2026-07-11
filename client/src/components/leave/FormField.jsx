export default function FormField({ label, htmlFor, error, required, optional, className = "", children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-slate-900">
        {label}

        {required && <span className="ml-1 text-red-600">*</span>}

        {optional && <span className="ml-1 font-normal text-slate-500">(Optional)</span>}
      </label>

      {children}

      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
