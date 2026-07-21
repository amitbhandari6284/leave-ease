import { useForm } from "react-hook-form";
import { useEffect } from "react";
import FormField from "../components/FormField.jsx";
import { X } from "lucide-react";

export default function PolicyModal({ isOpen, policy, onClose, onSave }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const entitlementMode = watch("entitlementMode");

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: policy?.name ?? "",
      description: policy?.description ?? "",
      entitlementMode:
        policy?.entitlement === "Unlimited" ? "Unlimited" : "Limited",
      entitlement:
        policy?.entitlement === "Unlimited" ? "" : policy?.entitlement ?? "",
      status: policy?.status ?? "Paid",
      type: policy?.type ?? "Fixed",
      active: policy?.active ?? true,
      iconType: policy?.iconType ?? "annual",
    });
  }, [isOpen, policy, reset]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 px-4 py-8"
      onMouseDown={onClose}
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
              {policy ? "Edit Leave Policy" : "Add Leave Type"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure entitlement, payment status, and policy behavior.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close policy modal"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>

        <form className="p-6" onSubmit={handleSubmit(onSave)} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Leave Type Name" error={errors.name?.message}>
              <input
                className={inputClass}
                placeholder="Annual Leave"
                {...register("name", {
                  required: "Leave type name is required",
                })}
              />
            </FormField>

            <FormField label="Icon Type" error={errors.iconType?.message}>
              <select
                className={inputClass}
                {...register("iconType", {
                  required: "Icon type is required",
                })}
              >
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </FormField>

            <FormField
              className="sm:col-span-2"
              label="Description"
              error={errors.description?.message}
            >
              <input
                className={inputClass}
                placeholder="Standard accrued"
                {...register("description", {
                  required: "Description is required",
                })}
              />
            </FormField>

            <FormField
              label="Entitlement Mode"
              error={errors.entitlementMode?.message}
            >
              <select
                className={inputClass}
                {...register("entitlementMode", {
                  required: "Entitlement mode is required",
                })}
              >
                <option value="Limited">Limited</option>
                <option value="Unlimited">Unlimited</option>
              </select>
            </FormField>

            <FormField
              label="Entitlement Days"
              error={errors.entitlement?.message}
            >
              <input
                type="number"
                min="1"
                disabled={entitlementMode === "Unlimited"}
                className={inputClass}
                placeholder="20"
                {...register("entitlement", {
                  validate: (value) => {
                    if (entitlementMode === "Unlimited") return true;
                    if (!value) return "Entitlement is required";
                    if (Number(value) < 1) return "Enter at least 1 day";
                    return true;
                  },
                })}
              />
            </FormField>

            <FormField label="Status" error={errors.status?.message}>
              <select
                className={inputClass}
                {...register("status", {
                  required: "Status is required",
                })}
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </FormField>

            <FormField label="Policy Type" error={errors.type?.message}>
              <select
                className={inputClass}
                {...register("type", {
                  required: "Policy type is required",
                })}
              >
                <option value="Accrual">Accrual</option>
                <option value="Fixed">Fixed</option>
                <option value="As needed">As needed</option>
              </select>
            </FormField>

            <label className="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <input
                type="checkbox"
                className="size-4 rounded border-violet-300 accent-indigo-600"
                {...register("active")}
              />
              Active policy
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-violet-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-11 rounded-lg px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="h-11 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {policy ? "Save Changes" : "Create Policy"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const inputClass = "h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
