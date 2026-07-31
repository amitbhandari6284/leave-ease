import { useEffect } from "react";
import { useForm } from "react-hook-form";

import EntityModal from "../shared/components/EntityModal.jsx";
import FormField from "../shared/components/FormField.jsx";

const defaultFormValues = {
  name: "",
  code: "",
  description: "",
  manager: "",
  maximumConcurrentLeaves: 3,
};

export default function DepartmentModal({
  isOpen,
  department,
  managers,
  isLoadingManagers,
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

  const isEditing = Boolean(department);

  useEffect(() => {
    if (!isOpen) return;

    reset({
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
      manager: department?.managerId ?? "",
      maximumConcurrentLeaves: department?.maximumConcurrentLeaves ?? 3,
    });
  }, [isOpen, department, reset]);

  function closeModal() {
    reset(defaultFormValues);
    onClose();
  }

  async function submitDepartment(formData) {
    try {
      await onSave({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        manager: formData.manager || null,
        maximumConcurrentLeaves: Number(formData.maximumConcurrentLeaves),
      });

      reset(defaultFormValues);
    } catch (error) {
      setError("root", {
        message: error?.message || "Unable to save department. Please try again.",
      });
    }
  }

  return (
    <EntityModal
      isOpen={isOpen}
      title={isEditing ? "Edit Department" : "Add Department"}
      subtitle={
        isEditing
          ? "Update department details and manager assignment."
          : "Create a department and assign an HR manager."
      }
      rootError={errors.root?.message}
      isSaving={isSaving}
      submitLabel={isEditing ? "Save Changes" : "Create Department"}
      onClose={closeModal}
      onSubmit={handleSubmit(submitDepartment)}
    >
      <FormField label="Department Name" error={errors.name?.message}>
        <input
          className={inputClass}
          placeholder="Engineering"
          {...register("name", {
            required: "Department name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
            maxLength: {
              value: 60,
              message: "Name cannot exceed 60 characters",
            },
          })}
        />
      </FormField>

      <FormField label="Department Code" error={errors.code?.message}>
        <input
          className={`${inputClass} uppercase`}
          placeholder="ENG"
          {...register("code", {
            required: "Department code is required",
            minLength: {
              value: 2,
              message: "Code must be at least 2 characters",
            },
            maxLength: {
              value: 10,
              message: "Code cannot exceed 10 characters",
            },
          })}
        />
      </FormField>

      <FormField label="HR Manager" error={errors.manager?.message}>
        <select
          disabled={isLoadingManagers}
          className={inputClass}
          {...register("manager")}
        >
          <option value="">
            {isLoadingManagers ? "Loading managers..." : "No manager assigned"}
          </option>

          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Max Concurrent Leaves"
        error={errors.maximumConcurrentLeaves?.message}
      >
        <input
          type="number"
          min="1"
          className={inputClass}
          {...register("maximumConcurrentLeaves", {
            required: "Maximum concurrent leaves is required",
            min: {
              value: 1,
              message: "Must be at least 1",
            },
          })}
        />
      </FormField>

      <FormField
        className="sm:col-span-2"
        label="Description"
        error={errors.description?.message}
      >
        <textarea
          rows={3}
          className={`${inputClass} h-auto resize-none py-2.5`}
          placeholder="Short description of the department"
          {...register("description", {
            maxLength: {
              value: 300,
              message: "Description cannot exceed 300 characters",
            },
          })}
        />
      </FormField>
    </EntityModal>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
