import { Mail } from "lucide-react";

import EntityRow, { EntityRowHeader } from "../../shared/components/EntityRow.jsx";
import EntityIdentity from "../../shared/components/EntityIdentity.jsx";
import RoleBadge from "./RoleBadge.jsx";

const GRID = "md:grid-cols-[1.8fr_1fr_1.4fr_0.9fr_0.9fr_0.9fr]";
const COLUMNS = ["User", "Employee ID", "Department", "Role", "Status", "Action"];

export function UserRowHeader() {
  return <EntityRowHeader gridClass={GRID} columns={COLUMNS} />;
}

export default function UserRow({
  user,
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
      isActive={user.isActive}
      entityName={user.name}
      isMenuOpen={isMenuOpen}
      isStatusUpdating={isStatusUpdating}
      openUpward={openUpward}
      onToggleMenu={onToggleMenu}
      onEdit={onEdit}
      onToggleStatus={onToggleStatus}
      identity={
        <EntityIdentity
          avatar={
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {getInitials(user.name)}
            </div>
          }
          title={user.name}
          subtitle={
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
              <Mail className="size-3.5 shrink-0" />
              {user.email}
            </p>
          }
        />
      }
      cells={[
        {
          label: "Employee ID",
          content: (
            <p className="font-medium whitespace-nowrap text-slate-700">
              {user.employeeId}
            </p>
          ),
        },
        {
          label: "Department",
          content: (
            <div>
              <p className="truncate font-medium text-slate-900">
                {user.department}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {user.designation}
              </p>
            </div>
          ),
        },
        {
          label: "Role",
          content: <RoleBadge role={user.role} />,
        },
      ]}
    />
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
