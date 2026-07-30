import { formatRoleLabel } from "../lib/helper.js"

const ROLE_CLASSES = {
  ADMIN: "bg-red-100 text-red-700",
  HR_MANAGER: "bg-amber-100 text-amber-700",
  EMPLOYEE: "bg-indigo-100 text-indigo-700",
};

export default function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ROLE_CLASSES[role] ?? "bg-slate-100 text-slate-700"
        }`}
    >
      {formatRoleLabel(role)}
    </span>
  );
}
