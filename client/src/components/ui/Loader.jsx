export default function Loader({ children }) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-xl border border-violet-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-700">{children}</p>
      </div>
    </div>
  );
}

