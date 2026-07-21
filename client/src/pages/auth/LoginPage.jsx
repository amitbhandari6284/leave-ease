import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/components/AuthContext.jsx";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { login, isLoggingIn } = useAuth();

  const redirectPath = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(formData) {
    try {
      const loggedInUser = await login({
        email: formData.email,
        password: formData.password,
      });

      navigate(redirectPath || loggedInUser.dashboardPath, {
        replace: true,
      });
    } catch (error) {
      setError("root", {
        message:
          error.response?.data?.message ||
          "Unable to sign in. Please check your credentials.",
      });
    }
  }

  const isLoading = isSubmitting || isLoggingIn;

  return (
    <main className="grid min-h-screen bg-[#faf8ff] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-indigo-700 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/15">
            <Building2 className="size-6" />
          </div>

          <div>
            <p className="text-xl font-bold">LeaveEase</p>
            <p className="text-sm text-indigo-100">Leave Management System</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
            Modern HR Operations
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight">
            Manage employee leave requests with clarity.
          </h1>

          <p className="mt-6 text-lg leading-8 text-indigo-100">
            Track balances, submit applications, review pending requests, and
            manage leave policies from one simple dashboard.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FeatureStat value="24/7" label="Self-service access" />
          <FeatureStat value="3" label="Role-based dashboards" />
          <FeatureStat value="100%" label="Audit-ready workflow" />
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building2 className="size-6" />
            </div>

            <div>
              <p className="text-xl font-bold text-slate-950">LeaveEase</p>
              <p className="text-sm text-slate-500">
                Leave Management System
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Sign in to your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use your LeaveEase credentials to continue.
              </p>
            </header>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {errors.root && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errors.root.message}
                </p>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@leaveease.com"
                    aria-invalid={Boolean(errors.email)}
                    className={`${inputClass} ${errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : ""
                      }`}
                    {...register("email", {
                      required: "Email address is required.",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Please enter a valid email address.",
                      },
                    })}
                  />
                </div>

                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative mt-2">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    className={`${inputClass} pr-12 ${errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : ""
                      }`}
                    {...register("password", {
                      required: "Password is required.",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters.",
                      },
                    })}
                  />

                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-violet-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureStat({ value, label }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-indigo-100">{label}</p>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-lg border border-violet-200 bg-violet-50/40 px-4 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export default LoginPage;
