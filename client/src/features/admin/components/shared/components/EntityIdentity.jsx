export default function EntityIdentity({ avatar, title, badge, subtitle }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatar}

      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-semibold text-slate-900">
          {title}
          {badge}
        </p>

        {subtitle}
      </div>
    </div>
  );
}
