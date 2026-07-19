import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router";

export default function ReviewLink({ request, fullWidth = false }) {
  const isPending = request.status === "Pending";

  return (
    <Link
      to={`/pending-requests/${request.id}`}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${isPending
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "border border-violet-200 bg-white text-slate-700 hover:bg-violet-50"
        } ${fullWidth ? "mt-5 w-full" : ""}`}
    >
      {isPending ? "Review" : "View Details"}
      <ArrowUpRight className="size-4" />
    </Link>
  );
}
