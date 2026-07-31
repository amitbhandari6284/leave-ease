export default function Error({ children }) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-700">{children}</p>
      </div>
    </div>
  );
}

