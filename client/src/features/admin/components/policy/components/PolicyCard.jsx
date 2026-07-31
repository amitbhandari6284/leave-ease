import StatusBadge from "../../../../../components/ui/StatusBadge.jsx";
import Toggle from "../../shared/components/Toggle.jsx";
import PolicyIdentity from "./PolicyIdentity.jsx";

export default function PolicyCard({ policy, onToggle, onEdit, onDelete }) {
  const statusBadgeClassName = policy.status === "Paid" ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-700";
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <PolicyIdentity policy={policy} />
        <StatusBadge className={statusBadgeClassName} status={policy.status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Entitlement</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {policy.entitlement} {policy.unit}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Type</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {policy.type}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">Active</dt>
          <dd className="mt-1">
            <Toggle enabled={policy.active} onClick={onToggle} />
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className="text-sm font-semibold text-indigo-600"
          onClick={onEdit}
        >
          Edit
        </button>

        <button
          type="button"
          className="text-sm font-semibold text-red-600"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
