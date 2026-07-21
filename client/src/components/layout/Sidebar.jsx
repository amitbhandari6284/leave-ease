import {
  BarChart3,
  CalendarDays,
  ClipboardClock,
  FileText,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router";

import { useAuth } from "../../features/auth/components/AuthContext";
import { useLogout } from "../../features/auth/hooks/useLogout";

const employeeLinks = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    roles: ["EMPLOYEE", "HR"],
  },
  {
    label: "My Leaves",
    to: "/my-leaves",
    icon: FileText,
    roles: ["EMPLOYEE", "HR"],
  },
  {
    label: "Apply Leave",
    to: "/apply-leave",
    icon: PlusCircle,
    roles: ["EMPLOYEE", "HR"],
  },
];

const hrLinks = [
  {
    label: "HR Dashboard",
    to: "/hr/dashboard",
    icon: LayoutDashboard,
    roles: ["HR"],
  },
  {
    label: "Leave Requests",
    to: "/pending-requests",
    icon: ClipboardClock,
    roles: ["HR"],
  },
  {
    label: "Department Calendar",
    to: "/calendar",
    icon: CalendarDays,
    roles: ["HR"],
  },
];

const adminLinks = [
  {
    label: "Admin Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    label: "User Management",
    to: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Policies",
    to: "/policies",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
  {
    label: "Reports",
    to: "/reports",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
];

function getVisibleLinks(links, role) {
  return links.filter((link) => link.roles.includes(role));
}

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const handleLogout = useLogout()

  const visibleEmployeeLinks = getVisibleLinks(employeeLinks, user?.role);
  const visibleHrLinks = getVisibleLinks(hrLinks, user?.role);
  const visibleAdminLinks = getVisibleLinks(adminLinks, user?.role);

  const canApplyForLeave = ["EMPLOYEE", "HR"].includes(user?.role);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-violet-200 bg-white transition-transform duration-200 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      <div className="flex h-24 items-start justify-between px-6 pt-6">
        <div>
          <p className="text-3xl font-bold tracking-tight text-indigo-600">LeaveEase</p>

          <p className="mt-1 text-xs text-slate-500">Workforce Management</p>
        </div>

        <button
          type="button"
          aria-label="Close sidebar"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>

      {canApplyForLeave && (
        <div className="px-4 mb-5">
          <NavLink
            to="/apply-leave"
            onClick={onClose}
            className="flex h-11  items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <PlusCircle className="size-5" />
            Apply for Leave
          </NavLink>
        </div>
      )}

      <nav className="mt-1 flex-1 overflow-y-auto px-2">
        {visibleEmployeeLinks.length > 0 && (<div className="space-y-1">
          {employeeLinks.map((link) => (
            <SidebarLink key={link.to} link={link} onClick={onClose} />
          ))}
        </div>)}
        {visibleHrLinks.length > 0 && (
          <>
            <p className="mt-8 px-4 text-xs font-medium tracking-wider text-slate-500">HR</p>

            <div className="mt-4 space-y-1">
              {hrLinks.map((link) => (
                <SidebarLink key={link.to} link={link} onClick={onClose} />
              ))}
            </div>
          </>)}
        {visibleAdminLinks.length > 0 && (
          <>
            <p className="mt-8 px-4 text-xs font-medium tracking-wider text-slate-500">ADMIN</p>

            <div className="mt-4 space-y-1">
              {adminLinks.map((link) => (
                <SidebarLink key={link.to} link={link} onClick={onClose} />
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-violet-200 px-2 py-5">
        <SidebarButton icon={Settings}>Settings</SidebarButton>
        <SidebarButton icon={LogOut} onClick={handleLogout}>Logout</SidebarButton>
      </div>
    </aside>
  );
}

function SidebarLink({ link, onClick }) {
  const Icon = link.icon;

  return (
    <NavLink
      to={link.to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex min-h-11 items-center gap-3 rounded-r-lg px-4 text-sm font-semibold transition ${isActive
          ? "bg-indigo-50 text-indigo-700 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      <Icon className="size-5" />
      {link.label}
    </NavLink>
  );
}

function SidebarButton({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      className="flex min-h-10 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      onClick={onClick}
    >
      <Icon className="size-5" />
      {children}
    </button>
  );
}

export default Sidebar;
