import { POLICY_ICONS, DEFAULT_POLICY_ICON } from "../utils/policyIcons.js";
import getPolicyIconClass from "./getPolicyIconClass.jsx";

export default function PolicyIdentity({ policy }) {
  const Icon = POLICY_ICONS[policy.iconType] ?? DEFAULT_POLICY_ICON;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${getPolicyIconClass(
          policy.iconType,
        )}`}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-bold text-slate-900">{policy.name}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {policy.description}
        </p>
      </div>
    </div>
  );
}
