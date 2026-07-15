import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router";

export default function ReviewLink({ requestId, fullWidth = false }) {
  return (
    <Link
      to={`/pending-requests/${requestId}`}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 ${fullWidth ? "mt-5 w-full" : ""
        }`}
    >
      Review
      <ArrowUpRight className="size-4" />
    </Link>
  );
}
