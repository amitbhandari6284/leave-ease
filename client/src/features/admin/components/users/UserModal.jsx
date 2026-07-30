import { useEffect } from "react";
import { useForm } from "react-hook-form";

import FormField from "../FormField";
import EntityModal from "../components/EntityModal";

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
    <EntityModal
      isOpen={isOpen}
      title={isEditing ? "Edit User" : "Add New User"}
      subtitle={
        isEditing
          ? "Update this user's account details."
          : "Create an account and assign access role."
      }
      rootError={errors.root?.message}
      isSaving={isSaving}
      submitLabel={isEditing ? "Save Changes" : "Create User"}
      onClose={closeModal}
      onSubmit={handleSubmit(submitUser)}
    >
      {isDepartmentsError && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 sm:col-span-2">
          Departments could not be loaded. Please try again.
        </p>
      )}

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
            {isLoadingDepartments ? "Loading departments..." : "Select department"}
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
    </EntityModal>
  );
}

function formatRoleLabel(role) {
  if (role === "ADMIN") return "Admin";
  if (role === "HR_MANAGER") return "HR Manager";
  return "Employee";
}

const inputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
