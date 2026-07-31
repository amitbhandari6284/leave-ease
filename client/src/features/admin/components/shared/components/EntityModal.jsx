import { useEffect } from "react";
import { X } from "lucide-react";

export default function EntityModal({
  isOpen,
  title,
  subtitle,
  rootError,
  isSaving,
  submitLabel,
  onClose,
  onSubmit,
  children,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 px-4 py-8"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>

        <form className="p-6" onSubmit={onSubmit} noValidate>
          {rootError && (
            <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {rootError}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">{children}</div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-violet-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-11 rounded-lg px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
