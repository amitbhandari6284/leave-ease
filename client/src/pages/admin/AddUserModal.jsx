import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "./FormField";

export default function AddUserModal({ isOpen, onClose, onAddUser }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      employeeId: "",
      role: "Employee",
      department: "",
      designation: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function submitUser(formData) {
    onAddUser(formData);
    reset();
  }

  function closeModal() {
    reset();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 px-4 py-8"
      onMouseDown={closeModal}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Add New User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create an account and assign access role.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close add user modal"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={closeModal}
          >
            <X className="size-5" />
          </button>
        </header>

        <form className="p-6" onSubmit={handleSubmit(submitUser)} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full Name" error={errors.name?.message}>
              <input
                className={inputClass}
                placeholder="Enter full name"
                {...register("name", {
                  required: "Full name is required",
                })}
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <input
                type="email"
                className={inputClass}
                placeholder="name@company.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
            </FormField>

            <FormField label="Employee ID" error={errors.employeeId?.message}>
              <input
                className={inputClass}
                placeholder="EMP-001"
                {...register("employeeId", {
                  required: "Employee ID is required",
                })}
              />
            </FormField>

            <FormField label="Role" error={errors.role?.message}>
              <select
                className={inputClass}
                {...register("role", {
                  required: "Role is required",
                })}
              >
                <option value="Employee">Employee</option>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </FormField>

            <FormField label="Department" error={errors.department?.message}>
              <input
                className={inputClass}
                placeholder="Engineering"
                {...register("department", {
                  required: "Department is required",
                })}
              />
            </FormField>

            <FormField label="Designation" error={errors.designation?.message}>
              <input
                className={inputClass}
                placeholder="Software Engineer"
                {...register("designation", {
                  required: "Designation is required",
                })}
              />
            </FormField>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-violet-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-11 rounded-lg px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={closeModal}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";
