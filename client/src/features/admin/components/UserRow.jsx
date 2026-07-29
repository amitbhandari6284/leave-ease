import { EllipsisVertical, Pencil, Power } from "lucide-react";
import StatusBadge from "../../../components/ui/StatusBadge";
import UserIdentity from "./UserIdentity";
import RoleBadge from "./RoleBadge";

const ROW_GRID =
  "grid-cols-2 md:grid-cols-[1.8fr_1fr_1.4fr_0.9fr_0.9fr_0.9fr]";

export function UserRowHeader() {
  return (
    <div
      role="row"
      className={`hidden border-b border-violet-200 bg-violet-50 px-6 py-4 text-xs font-semibold tracking-wide text-slate-600 uppercase md:grid md:items-center md:gap-4 ${ROW_GRID}`}
    >
      <span role="columnheader">User</span>
      <span role="columnheader">Employee ID</span>
      <span role="columnheader">Department</span>
      <span role="columnheader">Role</span>
      <span role="columnheader">Status</span>
      <span role="columnheader" className="text-right"> Action </span>
    </div>
  );
}

export default function UserRow({
  user,
  isMenuOpen,
  isStatusUpdating,
  openUpward,
  onToggleMenu,
  onEdit,
  onToggleStatus,
}) {
  const statusLabel = user.isActive ? "Active" : "Inactive";

  return (
    <div
      className={`grid gap-x-4 gap-y-4 border-b border-violet-100 px-5 py-5 text-sm last:border-b-0 md:items-center md:gap-4 md:px-6 md:py-5 ${ROW_GRID}`}
    >
      {/* User + (mobile-only) status badge on the same line */}
      <div className="col-span-2 flex items-center justify-between gap-4 md:col-span-1 md:block">
        <UserIdentity user={user} />
        <div className="shrink-0 md:hidden">
          <StatusBadge status={statusLabel} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 md:hidden">
          Employee ID
        </p>
        <p className="mt-1 font-medium whitespace-nowrap text-slate-700 md:mt-0">
          {user.employeeId}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 md:hidden">
          Department
        </p>
        <p className="mt-1 truncate font-medium text-slate-900 md:mt-0">
          {user.department}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {user.designation}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 md:hidden">
          Role
        </p>
        <div className="mt-1 md:mt-0">
          <RoleBadge role={user.role} />
        </div>
      </div>

      {/* Status column shown only on desktop (mobile shows it up top) */}
      <div className="hidden md:block">
        <StatusBadge status={statusLabel} />
      </div>

      {/* Actions: full-width buttons on mobile, kebab menu on desktop */}
      <div
        data-user-menu
        className="col-span-2 md:relative md:col-span-1 md:text-right"
      >
        <div className="flex w-full gap-3 md:hidden">
          <button
            type="button"
            className="h-10 flex-1 rounded-lg border border-violet-200 text-sm font-semibold text-slate-700 hover:bg-violet-50"
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            type="button"
            disabled={isStatusUpdating}
            className="h-10 flex-1 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onToggleStatus}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>

        <div className="relative hidden md:inline-block">
          <button
            type="button"
            aria-label={`Actions for ${user.name}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-slate-900"
            onClick={onToggleMenu}
          >
            <EllipsisVertical className="size-5" />
          </button>

          {isMenuOpen && (
            <div
              className={`absolute right-0 z-20 w-44 rounded-lg border border-violet-200 bg-white p-1 text-left shadow-lg ${openUpward ? "bottom-12" : "top-12"
                }`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50"
                onClick={onEdit}
              >
                <Pencil className="size-4" />
                Edit user
              </button>

              <button
                type="button"
                disabled={isStatusUpdating}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onToggleStatus}
              >
                <Power className="size-4" />
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
