function StatusBadge({ status }) {
  const statusClasses = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
    Cancelled: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        statusClasses[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
