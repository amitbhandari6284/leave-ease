import { FileText, X } from "lucide-react";

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SelectedFile({ file, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 text-left">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <FileText className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>

          <p className="mt-1 text-xs text-slate-500">{formatFileSize(file.size)}</p>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600"
        onClick={onRemove}
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

export default SelectedFile;
