export default function RoleBadge({ role }) {
  const roleClass = {
    Admin: "bg-red-100 text-red-700",
    HR: "bg-indigo-100 text-indigo-700",
    Employee: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${roleClass[role]}`}
    >
      {role}
    </span>
  );
}
