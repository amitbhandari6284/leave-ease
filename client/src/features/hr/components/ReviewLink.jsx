import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

export default function ReviewLink({ request }) {
  const isPending = request.status === "Pending";

  return (
    <Link
      to={`/pending-requests/${request.id}`}
      className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold md:mt-0 md:w-auto md:inline-flex ${isPending
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "border border-violet-200 bg-white text-slate-700 hover:bg-violet-50"
        }`}
    >
      {isPending ? "Review" : "View Details"}
      <ArrowUpRight className="size-4" />
    </Link>
  );
}
