import StatusBadge from "../../components/ui/StatusBadge";
import RoleBadge from "./RoleBadge";
import UserIdentity from "./UserIdentity";

export default function UserCard({ user, onToggleStatus }) {
  const statusBadegeClassName = user.status === "Acivte" ? "bg-emerald-100 text-emerald-700" : ""
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <UserIdentity user={user} />
        <StatusBadge className={statusBadegeClassName} status={user.status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Employee ID</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {user.employeeId}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="mt-1">
            <RoleBadge role={user.role} />
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Department</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {user.department}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Designation</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {user.designation}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className={`mt-5 text-sm font-semibold ${user.status === "Active" ? "text-red-600" : "text-emerald-700"
          }`}
        onClick={onToggleStatus}
      >
        {user.status === "Active" ? "Deactivate user" : "Activate user"}
      </button>
    </article>
  );
}
