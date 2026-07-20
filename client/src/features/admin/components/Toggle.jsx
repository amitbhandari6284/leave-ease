export default function Toggle({ enabled, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? "bg-indigo-600" : "bg-slate-300"
        }`}
      onClick={onClick}
    >
      <span
        className={`absolute top-1 size-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"
          }`}
      />
    </button>
  );
}
