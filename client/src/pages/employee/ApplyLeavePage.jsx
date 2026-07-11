import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { calculateWorkingDays, getTodayInputValue } from "../../utils/calculateWorkingDays";
import FormField from "../../components/leave/FormField";
import BalanceImpactCard from "../../components/leave/BalanceImpactCard";
import SelectedFile from "../../components/leave/SelectedFile";
import TeamAvailabilityCard from "../../components/leave/TeamAvailabilityCard";

const leaveTypes = [
  {
    id: "casual",
    name: "Casual Leave",
    currentBalance: 4,
  },
  {
    id: "sick",
    name: "Sick Leave",
    currentBalance: 6,
  },
  {
    id: "earned",
    name: "Earned Leave",
    currentBalance: 15,
  },
  {
    id: "unpaid",
    name: "Unpaid Leave",
    currentBalance: null,
  },
];

const allowedFileTypes = ["application/pdf", "image/png", "image/jpeg"];

const maxFileSize = 5 * 1024 * 1024;

function ApplyLeavePage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      document: null,
    },
  });

  const selectedLeaveTypeId = watch("leaveType");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const selectedDocuments = watch("document");

  const selectedLeaveType = leaveTypes.find((leaveType) => leaveType.id === selectedLeaveTypeId);

  const selectedFile = selectedDocuments?.[0] ?? null;

  const workingDays = useMemo(() => calculateWorkingDays(startDate, endDate), [startDate, endDate]);

  const balanceAfterRequest = useMemo(() => {
    if (selectedLeaveType?.currentBalance == null) {
      return null;
    }

    return selectedLeaveType.currentBalance - workingDays;
  }, [selectedLeaveType, workingDays]);

  const hasInsufficientBalance = selectedLeaveType?.currentBalance != null && workingDays > selectedLeaveType.currentBalance;

  const balancePercentage = selectedLeaveType?.currentBalance ? Math.min((selectedLeaveType.currentBalance / 20) * 100, 100) : 0;

  async function onSubmit(formData) {
    setSuccessMessage("");

    await new Promise((resolve) => setTimeout(resolve, 900));

    const payload = {
      leaveTypeId: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      workingDays,
      reason: formData.reason.trim(),
      document: formData.document?.[0] ?? null,
    };

    console.log("Leave request:", payload);

    setSuccessMessage("Your leave request has been submitted successfully.");
    reset();
  }

  function handleDrop(event) {
    event.preventDefault();

    const files = event.dataTransfer.files;

    if (!files.length) return;

    setValue("document", files, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function removeSelectedFile() {
    setValue("document", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Apply for Leave</h1>

        <p className="mt-1 text-slate-500">Submit a new time-off request for approval.</p>
      </header>

      {successMessage && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <form
          className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm sm:p-7"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <FormField label="Leave Type" htmlFor="leaveType" error={errors.leaveType?.message} required>
            <select
              id="leaveType"
              className={getInputClass(Boolean(errors.leaveType))}
              {...register("leaveType", {
                required: "Select a leave type",
              })}
            >
              <option value="">Select a leave type</option>

              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FormField label="Start Date" htmlFor="startDate" error={errors.startDate?.message} required>
              <input
                id="startDate"
                type="date"
                min={getTodayInputValue()}
                className={getInputClass(Boolean(errors.startDate))}
                {...register("startDate", {
                  required: "Start date is required",
                  validate: (value) => value >= getTodayInputValue() || "Start date cannot be in the past",
                  onChange: () => {
                    if (getValues("endDate")) {
                      setValue("endDate", getValues("endDate"), {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
            </FormField>

            <FormField label="End Date" htmlFor="endDate" error={errors.endDate?.message} required>
              <input
                id="endDate"
                type="date"
                min={startDate || getTodayInputValue()}
                className={getInputClass(Boolean(errors.endDate))}
                {...register("endDate", {
                  required: "End date is required",
                  validate: (value) => {
                    const selectedStartDate = getValues("startDate");

                    if (!selectedStartDate) {
                      return "Select a start date first";
                    }

                    return value >= selectedStartDate || "End date cannot be before the start date";
                  },
                })}
              />
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-dashed border-violet-300 bg-violet-50/70 px-4 py-5">
            <span className="text-sm text-slate-600">Calculated Duration:</span>

            <strong className="text-xl text-indigo-600">
              {startDate && endDate ? workingDays : "--"} {workingDays === 1 ? "Day" : "Days"}
            </strong>
          </div>

          {startDate && endDate && workingDays === 0 && (
            <p className="mt-2 text-sm text-amber-700">The selected range contains no working days.</p>
          )}

          {hasInsufficientBalance && (
            <p className="mt-2 text-sm text-red-600">Your request exceeds the available leave balance.</p>
          )}

          <FormField className="mt-6" label="Reason" htmlFor="reason" error={errors.reason?.message} optional>
            <textarea
              id="reason"
              rows="4"
              placeholder="Briefly describe the reason for your leave..."
              className={`${getInputClass(Boolean(errors.reason))} min-h-28 resize-y py-3`}
              {...register("reason", {
                maxLength: {
                  value: 500,
                  message: "Reason cannot exceed 500 characters",
                },
              })}
            />
          </FormField>

          <FormField className="mt-6" label="Supporting Document" htmlFor="document" error={errors.document?.message} optional>
            <div
              className="rounded-lg border-2 border-dashed border-violet-300 bg-violet-50/40 px-5 py-7 text-center transition hover:border-indigo-400"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <SelectedFile file={selectedFile} onRemove={removeSelectedFile} />
              ) : (
                <>
                  <Upload className="mx-auto size-8 text-slate-500" />

                  <label
                    htmlFor="document"
                    className="mt-3 inline-block cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Upload a file
                  </label>

                  <span className="text-sm text-slate-600"> or drag and drop</span>

                  <p className="mt-2 text-xs text-slate-500">PNG, JPG, or PDF up to 5 MB</p>
                </>
              )}

              <input
                id="document"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                className="sr-only"
                {...register("document", {
                  validate: (files) => {
                    const file = files?.[0];

                    if (!file) return true;

                    if (!allowedFileTypes.includes(file.type)) {
                      return "Upload a PNG, JPG, JPEG, or PDF file";
                    }

                    if (file.size > maxFileSize) {
                      return "File size cannot exceed 5 MB";
                    }

                    return true;
                  },
                })}
              />
            </div>
          </FormField>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-violet-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-11 rounded-lg px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || hasInsufficientBalance || workingDays === 0}
              className="h-11 rounded-lg bg-teal-700 px-6 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <BalanceImpactCard
            selectedLeaveType={selectedLeaveType}
            workingDays={workingDays}
            balanceAfterRequest={balanceAfterRequest}
            balancePercentage={balancePercentage}
          />

          <TeamAvailabilityCard startDate={startDate} endDate={endDate} workingDays={workingDays} />
        </aside>
      </div>
    </div>
  );
}

function getInputClass(hasError) {
  return `h-12 w-full rounded-lg border bg-violet-50/40 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 ${
    hasError ? "border-red-500" : "border-violet-200"
  }`;
}

export default ApplyLeavePage;
