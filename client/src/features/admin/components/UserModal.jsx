import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "./FormField";

const roleOptions = ["EMPLOYEE", "HR_MANAGER", "ADMIN"];

const defaultFormValues = {
  name: "",
  email: "",
  employeeId: "",
  password: "",
  role: "EMPLOYEE",
  department: "",
  designation: "",
  phone: "",
};

export default function UserModal({
  isOpen,
  user,
  departments,
  isLoadingDepartments,
  isDepartmentsError,
  isSaving,
  onClose,
  onSave,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: defaultFormValues,
  });

  const isEditing = Boolean(user);

  useEffect(() => {
    if (!isOpen) return;

    reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      employeeId: user?.employeeId ?? "",
      password: "",
      role: user?.role ?? "EMPLOYEE",
      department: user?.departmentId ?? "",
      designation: user?.designation ?? "",
      phone: user?.phone ?? "",
    });
  }, [isOpen, user, reset]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function closeModal() {
    reset(defaultFormValues);
    onClose();
  }

  async function submitUser(formData) {
    try {
      await onSave(formData);
      reset(defaultFormValues);
    } catch (error) {
      setError("root", {
        message: error?.message || "Unable to save user. Please try again.",
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 px-4 py-8"
      onMouseDown={closeModal}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-violet-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isEditing ? "Edit User" : "Add New User"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update this user's account details."
                : "Create an account and assign access role."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close user modal"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={closeModal}
          >
            <X className="size-5" />
          </button>
        </header>

        <form className="p-6" onSubmit={handleSubmit(submitUser)} noValidate>
          {errors.root && (
            <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errors.root.message}
            </p>
          )}

          {isDepartmentsError && (
            <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              Departments could not be loaded. Please try again.
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full Name" error={errors.name?.message}>
              <input
                className={inputClass}
                placeholder="Enter full name"
                {...register("name", {
                  required: "Full name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <input
                type="email"
                className={inputClass}
                placeholder="name@leaveease.com"
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
                disabled={isEditing}
                className={inputClass}
                placeholder="LE-EMP-010"
                {...register("employeeId", {
                  validate: (value) => {
                    if (isEditing) return true;
                    return value.trim() ? true : "Employee ID is required";
                  },
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
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Department" error={errors.department?.message}>
              <select
                disabled={isLoadingDepartments}
                className={inputClass}
                {...register("department", {
                  required: "Department is required",
                })}
              >
                <option value="">
                  {isLoadingDepartments
                    ? "Loading departments..."
                    : "Select department"}
                </option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                    {department.isActive === false ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
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

            <FormField label="Phone" error={errors.phone?.message}>
              <input
                type="tel"
                className={inputClass}
                placeholder="+91 9876543210"
                {...register("phone")}
              />
            </FormField>

            <FormField
              label={isEditing ? "New Password (optional)" : "Temporary Password"}
              error={errors.password?.message}
            >
              <input
                type="password"
                className={inputClass}
                placeholder={isEditing ? "Leave empty to keep current" : "Temporary@123"}
                {...register("password", {
                  validate: (value) => {
                    if (!isEditing && !value) {
                      return "Temporary password is required";
                    }
                    if (value && value.length < 6) {
                      return "Password must be at least 6 characters";
                    }
                    return true;
                  },
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
              disabled={isSaving}
              className="h-11 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function formatRoleLabel(role) {
  if (role === "ADMIN") return "Admin";
  if (role === "HR_MANAGER") return "HR Manager";
  return "Employee";
}

const inputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
