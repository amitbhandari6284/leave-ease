import { Link } from "react-router"
import { CirclePlus } from "lucide-react"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { getCurrentDate } from "../utils/helper.js"

export default function Welcome() {
  const { user } = useAuth()
  return (
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome Back, {user?.name || "Employee"}.</h1>
        <p className="mt-1 text-sm text-slate-500">{getCurrentDate()}</p>
      </div>
      <Link
        to="/apply-leave"
        className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        <CirclePlus className="size-5" />
        Apply for Leave
      </Link>
    </section>
  )
}

