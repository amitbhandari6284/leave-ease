import { Building2 } from "lucide-react";

import EntityIdentity from "../shared/components/EntityIdentity.jsx";
import EntityRow, { EntityRowHeader } from "../shared/components/EntityRow.jsx";

const GRID = "md:grid-cols-[2fr_1.2fr_1fr_0.9fr_0.9fr]";
const COLUMNS = ["Department", "Manager", "Max Concurrent Leaves", "Status", "Action"];

export function DepartmentRowHeader() {
  return <EntityRowHeader gridClass={GRID} columns={COLUMNS} />;
}

export default function DepartmentRow({
  department,
  isMenuOpen,
  isStatusUpdating,
  openUpward,
  onToggleMenu,
  onEdit,
  onToggleStatus,
}) {
  return (
    <EntityRow
      gridClass={GRID}
      isActive={department.isActive}
      entityName={department.name}
      isMenuOpen={isMenuOpen}
      isStatusUpdating={isStatusUpdating}
      openUpward={openUpward}
      onToggleMenu={onToggleMenu}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      identity={
        <EntityIdentity
          avatar={
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="size-5" />
            </div>
          }
          title={department.name}
          badge={
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-600">
              {department.code}
            </span>
          }
          subtitle={
            department.description && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {department.description}
              </p>
            )
          }
        />
      }
      cells={[
        {
          label: "Manager",
          content: (
            <p className="truncate font-medium text-slate-900">
              {department.managerName || "Unassigned"}
            </p>
          ),
        },
        {
          label: "Max Concurrent Leaves",
          content: (
            <p className="font-medium text-slate-700">
              {department.maximumConcurrentLeaves}
            </p>
          ),
        },
      ]}
    />
  );
}
