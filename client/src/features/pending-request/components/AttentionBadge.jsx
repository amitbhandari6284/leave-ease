export default function AttentionBadge({ request }) {
  if (request.conflicts.length > 0) {
    return <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Conflict</span>;
  }

  if (request.hasDocument) {
    return <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">Document</span>;
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">No issues</span>
  );
}

