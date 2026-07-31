import { getStatusBadgeClass } from "../../utils/helper.js";

function StatusBadge({ status, className }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className ?? getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
