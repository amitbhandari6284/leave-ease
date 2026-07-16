import { FileText } from "lucide-react";


export default function EmptyState({ title, message, onClearFilters }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <FileText className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {onClearFilters && (
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-indigo-600"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

