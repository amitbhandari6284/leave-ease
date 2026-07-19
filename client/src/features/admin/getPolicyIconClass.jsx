export default function getPolicyIconClass(iconType) {
  const classes = {
    annual: "bg-indigo-100 text-indigo-700",
    sick: "bg-red-100 text-red-600",
    unpaid: "bg-slate-100 text-slate-600",
  };

  return classes[iconType] ?? "bg-indigo-100 text-indigo-700";
}
