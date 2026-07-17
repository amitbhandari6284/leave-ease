function StatusBadge({ status }) {
  // 1. Map "Active" to "Approved" so they share a single configuration key
  const normalizedStatus = status === "Active" ? "Approved" : status;

  const statusClasses = {
    Approved: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    Rejected: "bg-red-100 text-red-700",
    // 2. We don't even need "Cancelled" here anymore because it will automatically hit the ?? fallback
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses[normalizedStatus] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
