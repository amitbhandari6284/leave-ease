import { EllipsisVertical, Pencil, Power } from "lucide-react";

import StatusBadge from "../../../../components/ui/StatusBadge.jsx";

export function EntityRowHeader({ gridClass, columns }) {
  return (
    <div
      role="row"
      className={`hidden border-b border-violet-200 bg-violet-50 px-6 py-4 text-xs font-semibold tracking-wide text-slate-600 uppercase md:grid md:items-center md:gap-4 ${gridClass}`}
    >
      {columns.map((column, index) => (
        <span
          key={column}
          role="columnheader"
          className={index === columns.length - 1 ? "text-right" : undefined}
        >
          {column}
        </span>
      ))}
    </div>
  );
}

export default function EntityRow({
  gridClass,
  identity,
  cells,
  isActive,
  entityName,
  isMenuOpen,
  isStatusUpdating,
  openUpward,
  onToggleMenu,
  onEdit,
  onToggleStatus,
}) {
  const statusLabel = isActive ? "Active" : "Inactive";

  return (
    <div
      role="row"
      aria-label={`${entityName}, ${statusLabel}`}
      className={`grid grid-cols-2 gap-x-4 gap-y-4 border-b border-violet-100 px-5 py-5 text-sm last:border-b-0 md:items-center md:gap-4 md:px-6 md:py-5 ${gridClass}`}
    >
      {/* Identity + (mobile-only) status badge on the same line */}
      <div
        role="cell"
        className="col-span-2 flex items-center justify-between gap-4 md:col-span-1 md:block"
      >
        {identity}
        <div className="shrink-0 md:hidden">
          <StatusBadge status={statusLabel} />
        </div>
      </div>

      {cells.map(({ label, content }) => (
        <div role="cell" key={label} className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 md:hidden">
            {label}
          </p>
          <div className="mt-1 md:mt-0">{content}</div>
        </div>
      ))}

      {/* Status column shown only on desktop (mobile shows it up top) */}
      <div role="cell" className="hidden md:block">
        <StatusBadge status={statusLabel} />
      </div>

      {/* Actions: full-width buttons on mobile, kebab menu on desktop */}
      <div
        role="cell"
        data-row-menu
        className="col-span-2 md:relative md:col-span-1 md:text-right"
      >
        <div className="flex w-full gap-3 md:hidden">
          <button
            type="button"
            className="h-10 flex-1 rounded-lg border border-violet-200 text-sm font-semibold text-slate-700 hover:bg-violet-50"
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            type="button"
            disabled={isStatusUpdating}
            className="h-10 flex-1 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onToggleStatus}
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
        </div>

        <div className="relative hidden md:inline-block">
          <button
            type="button"
            aria-label={`Actions for ${entityName}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-slate-900"
            onClick={onToggleMenu}
          >
            <EllipsisVertical className="size-5" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className={`absolute right-0 z-20 w-44 rounded-lg border border-violet-200 bg-white p-1 text-left shadow-lg ${openUpward ? "bottom-12" : "top-12"
                }`}
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50"
                onClick={onEdit}
              >
                <Pencil className="size-4" />
                Edit
              </button>

              <button
                type="button"
                role="menuitem"
                disabled={isStatusUpdating}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onToggleStatus}
              >
                <Power className="size-4" />
                {isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
