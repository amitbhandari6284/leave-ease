export default function SummaryCard({ children }) {
  return (
    <article className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      {children}
    </article>
  );
}

