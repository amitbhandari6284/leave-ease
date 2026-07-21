import { Bell, Menu } from "lucide-react";

import { useAuth } from "../../features/auth/components/AuthContext";
import { useLogout } from "../../features/auth/hooks/useLogout";

function Header({ onOpenSidebar }) {
  const { user } = useAuth()
  const handleLogout = useLogout()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-violet-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="size-6" />
        </button>

        <p className="text-xl font-bold text-indigo-700">LeaveEase</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="View notifications"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Bell className="size-5" />

          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={handleLogout}
          title="Logout"
        >
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user?.name}
            </p>
            <p className="text-right text-xs text-slate-500">
              {user?.role}
            </p>
          </div>

          <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {user?.initials}
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
