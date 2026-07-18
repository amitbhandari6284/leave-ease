function StatusBadge({ className, status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className ?? "bg - slate - 100 text-slate-600"} `}>
      {status}
    </span>
  );
}



export default StatusBadge;
