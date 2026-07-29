import { Mail } from "lucide-react";

export default function UserIdentity({ user }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
        {getInitials(user.name)}
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{user.name}</p>

        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
          <Mail className="size-3.5 shrink-0" />
          {user.email}
        </p>
      </div>
    </div>
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
