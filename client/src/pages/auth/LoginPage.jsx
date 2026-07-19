import { useState } from "react";
import { useForm } from "react-hook-form";
import { BadgeCheck, CalendarCheck2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/AuthContext";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation()
  const { login } = useAuth()

  const redirectPath = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(formData) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const loggedInUser = login(formData);

    navigate(redirectPath || loggedInUser.dashboardPath, {
      replace: true,
    });
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[46%_54%]">
      <BrandPanel />

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo dark />
          </div>

          <header className="mb-9">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back</h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">Please enter your credentials to access your dashboard.</p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-900">
                Email address
              </label>

              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="employee@company.com"
                  className={`h-13 w-full border bg-violet-50/40 pr-4 pl-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 ${errors.email ? "border-red-500" : "border-violet-200"
                    }`}
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
              </div>

              {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="password" className="text-sm font-semibold text-slate-900">
                  Password
                </label>

                <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`h-13 w-full border bg-violet-50/40 pr-12 pl-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 ${errors.password ? "border-red-500" : "border-violet-200"
                    }`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must contain at least 6 characters",
                    },
                  })}
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>

              {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <label className="flex w-fit items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="size-4 rounded border-slate-300 accent-indigo-600" {...register("rememberMe")} />

              <span>Remember me</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-13 w-full items-center justify-center rounded-lg bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-7 text-center text-sm text-slate-600">
            Need an account?{" "}
            <button type="button" className="font-medium text-indigo-600 hover:text-indigo-700">
              Contact HR
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-indigo-600 px-12 py-14 text-white lg:flex lg:flex-col lg:items-center lg:justify-between">
      <div className="absolute -top-28 -left-28 size-80 rounded-full bg-white/5" />
      <div className="absolute -right-32 bottom-20 size-96 rounded-full bg-violet-400/10" />

      <div className="relative w-full max-w-md">
        <Logo />
      </div>

      <div className="relative flex w-full max-w-md justify-center">
        <div className="relative flex h-64 w-full items-center justify-center">
          <div className="absolute h-36 w-72 -rotate-3 rounded-3xl bg-white/10 blur-sm" />

          <div className="relative flex size-36 -rotate-6 items-center justify-center rounded-3xl bg-white/95 shadow-2xl">
            <CalendarCheck2 className="size-20 text-indigo-600" />
          </div>

          <div className="relative -ml-7 flex size-24 rotate-6 items-center justify-center rounded-full bg-emerald-400 shadow-2xl">
            <BadgeCheck className="size-14 text-white" />
          </div>
        </div>
      </div>

      <div className="relative max-w-md text-center">
        <h2 className="text-3xl font-bold leading-tight">Leave management, made effortless.</h2>

        <p className="mt-5 leading-7 text-indigo-100">
          Streamline requests, track balances, and manage your team&apos;s availability with absolute clarity.
        </p>
      </div>
    </aside>
  );
}

function Logo({ dark = false }) {
  return (
    <div className={`flex items-center gap-3 text-2xl font-bold ${dark ? "text-indigo-600" : "text-white"}`}>
      <CalendarCheck2 className="size-8" />
      <span>LeaveEase</span>
    </div>
  );
}

export default LoginPage;
