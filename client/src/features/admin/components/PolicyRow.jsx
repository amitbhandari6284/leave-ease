import { Edit3, Trash2 } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import PolicyIdentity from "./PolicyIdentity";
import Toggle from "./Toggle";

export default function PolicyRow({ policy, onToggle, onEdit, onDelete }) {
  const statusBadgeClassName = policy.status === "Paid" ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-700";
  return (
    <tr className="border-b border-violet-100 text-sm last:border-b-0">
      <td className="px-6 py-5 align-middle">
        <PolicyIdentity policy={policy} />
      </td>

      <td className="px-6 py-5 align-middle font-medium text-slate-900">
        {policy.entitlement}
        {policy.unit && (
          <span className="block text-slate-700">{policy.unit}</span>
        )}
      </td>

      <td className="px-6 py-5 align-middle">
        <StatusBadge className={statusBadgeClassName} status={policy.status} />
      </td>

      <td className="px-6 py-5 align-middle text-slate-700">
        {policy.type}
      </td>

      <td className="px-6 py-5 align-middle">
        <Toggle enabled={policy.active} onClick={onToggle} />
      </td>

      <td className="px-6 py-5 text-right align-middle">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label={`Edit ${policy.name}`}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onEdit}
          >
            <Edit3 className="size-4" />
          </button>

          <button
            type="button"
            aria-label={`Delete ${policy.name}`}
            className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
