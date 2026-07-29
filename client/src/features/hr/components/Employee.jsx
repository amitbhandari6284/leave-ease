export default function Employee({ request }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {request.initials}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{request.employee}</p>
        <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500">{request.department}</p>
      </div>
    </div>
  );
}
