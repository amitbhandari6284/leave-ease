function LeaveTypeBadge({ type }) {
  const isSickLeave = type === "Sick Leave";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        isSickLeave ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"
      }`}
    >
      {type}
    </span>
  );
}

export default LeaveTypeBadge;
