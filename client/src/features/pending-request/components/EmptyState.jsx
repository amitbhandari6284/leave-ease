
import { FileText } from "lucide-react"


export default function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <FileText className="size-6" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">No pending requests found</h3>

      <p className="mt-2 text-sm text-slate-500">Try changing the selected filters.</p>
    </div>
  );
}
