import { Building2, EllipsisVertical } from "lucide-react";
import UserIdentity from "./UserIdentity";
import RoleBadge from "./RoleBadge";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function UserRow({ user, isMenuOpen, openUpward, onToggleMenu, onToggleStatus }) {
  const isActive = user.status === "Active";
  return (
    <tr className="border-b border-violet-100 text-sm last:border-b-0">
      <td className="px-6 py-5 align-middle">
        <UserIdentity user={user} />
      </td>

      <td className="px-6 py-5 align-middle font-medium whitespace-nowrap text-slate-700">{user.employeeId}</td>

      <td className="px-6 py-5 align-middle">
        <div className="flex items-center gap-2 text-slate-700">
          <Building2 className="size-4 text-slate-400" />
          <span className="whitespace-nowrap">{user.department}</span>
        </div>
      </td>

      <td className="px-6 py-5 align-middle">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-6 py-5 align-middle">
        <StatusBadge status={user.status} />
      </td>

      <td data-user-menu className="relative px-6 py-5 text-right align-middle">
        <button
          type="button"
          aria-label={`Actions for ${user.name}`}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          onClick={onToggleMenu}
        >
          <EllipsisVertical className="size-5" />
        </button>

        {isMenuOpen && (
          <div className={`absolute right-6 z-20 w-44 rounded-lg border border-violet-200 bg-white p-1 text-left shadow-lg ${openUpward ? "bottom-14" : "top-14"}`} >
            <button type="button" className="w-full rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Edit user
            </button>

            <button
              type="button"
              className={`w-full rounded-md px-3 py-2 text-sm ${isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"
                }`}
              onClick={onToggleStatus}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
