function EmployeeDisplay({ request }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {request.initials}
      </div>

      <div>
        <p className="font-semibold text-slate-900">{request.employee}</p>

        <p className="mt-0.5 text-sm text-slate-500">{request.department}</p>
      </div>
    </div>
  );
}

export default EmployeeDisplay;
