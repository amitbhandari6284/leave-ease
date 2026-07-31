import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";

import DateRangePicker from "../../components/ui/DateRangePicker.jsx";

import BalanceImpactCard from "../../features/employee/apply/components/BalanceImpactCard.jsx";
import FormField from "../../features/employee/apply/components/FormField.jsx";
import PolicyHelpCard from "../../features/employee/apply/components/PolicyHelpCard.jsx";
import SelectedFile from "../../features/employee/apply/components/SelectedFile.jsx";
import TeamAvailabilityCard from "../../features/employee/apply/components/TeamAvailabilityCard.jsx";

import { normalizeLeaveBalancesResponse, normalizeLeaveTypesResponse } from "../../features/employee/apply/utils/normalizeApiData.js";
import { createLeaveRequest, getLeaveTypes, getMyLeaveBalances } from "../../features/leave/utils/leaveApi.js";
import { calculateWorkingDays, getTodayInputValue } from "../../utils/calculateWorkingDays.js";
import { parseInputDate, toInputDateString } from "../../utils/calendarUtils.js";

const allowedFileTypes = ["application/pdf", "image/png", "image/jpeg"];

const maxFileSize = 5 * 1024 * 1024;

function ApplyLeavePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");
  const { register, handleSubmit, control, setValue, getValues, reset, setError, clearErrors, formState: { errors, isSubmitting }, } = useForm(
    {
      defaultValues: {
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        document: null,
        isHalfDay: false,
      },
    });

  const { data: leaveTypesData, isLoading: isLoadingLeaveTypes, isError: isLeaveTypesError, error: leaveTypesError, } = useQuery(
    {
      queryKey: ["leave-types"],
      queryFn: getLeaveTypes,
    });

  const { data: balancesData, isLoading: isLoadingBalances, isError: isBalancesError, } = useQuery(
    {
      queryKey: ["leave-balances", "me"],
      queryFn: getMyLeaveBalances,
    });

  const leaveTypes = useMemo(() => normalizeLeaveTypesResponse(leaveTypesData), [leaveTypesData]);
  const leaveBalances = useMemo(() => normalizeLeaveBalancesResponse(balancesData), [balancesData]);

  const selectedLeaveTypeId = useWatch({ control, name: "leaveType" });
  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });
  const selectedDocuments = useWatch({ control, name: "document" });

  const selectedLeaveType = leaveTypes.find((leaveType) => leaveType.id === selectedLeaveTypeId);
  const selectedBalance = leaveBalances.find((balance) => balance.leaveTypeId === selectedLeaveTypeId);

  const selectedFile = selectedDocuments?.[0] ?? null;

  const workingDays = useMemo(() => calculateWorkingDays(startDate, endDate), [startDate, endDate]);

  const isSingleDaySelected = Boolean(startDate) && startDate === endDate;
  const canRequestHalfDay = Boolean(selectedLeaveType?.allowHalfDay) && isSingleDaySelected;
  const isHalfDay = useWatch({ control, name: "isHalfDay" });

  // Half-day only makes sense for a single-day request on a leave type that
  // supports it, so clear a stale selection if the leave type or date range
  // changes underneath it.
  useEffect(() => {
    if (!canRequestHalfDay && isHalfDay) {
      setValue("isHalfDay", false, { shouldDirty: true });
    }
  }, [canRequestHalfDay, isHalfDay, setValue]);

  const requestedDays = canRequestHalfDay && isHalfDay ? 0.5 : workingDays;

  const isUnpaidLeaveType = selectedLeaveType?.isPaid === false;
  const availableBalance = selectedBalance?.available ?? 0;

  const balanceAfterRequest = useMemo(() => {
    if (!selectedBalance || isUnpaidLeaveType) return null;

    return availableBalance - requestedDays;
  }, [selectedBalance, isUnpaidLeaveType, availableBalance, requestedDays]);

  const hasInsufficientBalance =
    !isUnpaidLeaveType && Boolean(selectedBalance) && requestedDays > 0 && requestedDays > availableBalance;

  const balancePercentage = selectedBalance
    ? Math.min((availableBalance / (selectedBalance.total || 20)) * 100, 100)
    : 0;

  const hasDateRangeError = Boolean(errors.startDate || errors.endDate);
  const dateRangeTriggerClass = `flex h-12 w-full flex-col justify-center rounded-lg border bg-violet-50/40 px-4 text-left text-sm outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 ${hasDateRangeError ? "border-red-500" : "border-violet-200"
    }`;

  const createMutation = useMutation({
    mutationFn: createLeaveRequest,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "me"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances", "me"] });

      reset();
      setSuccessMessage("Your leave request has been submitted successfully.");
    },
  });

  async function onSubmit(formData) {
    setSuccessMessage("");
    clearErrors("root");

    try {
      await createMutation.mutateAsync({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isHalfDay: canRequestHalfDay ? Boolean(formData.isHalfDay) : false,
        workingDays: requestedDays,
        reason: formData.reason.trim(),
        document: formData.document?.[0] ?? null,
      });
    } catch (error) {
      setError("root", {
        message:
          error.response?.data?.message || "Unable to submit leave request. Please try again.",
      });
    }
  }

  function handleDateRangeChange({ startDate: newStartDate, endDate: newEndDate }) {
    setValue("startDate", toInputDateString(newStartDate), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("endDate", toInputDateString(newEndDate), {
      shouldDirty: true,
      shouldValidate: true,
    });
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

  const isSaving = isSubmitting || createMutation.isPending;

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

      {errors.root && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" />

          <p className="text-sm font-medium">{errors.root.message}</p>
        </div>
      )}

      {isLeaveTypesError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {leaveTypesError?.response?.data?.message || "Unable to load leave types."}
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
              disabled={isLoadingLeaveTypes}
              className={getInputClass(Boolean(errors.leaveType))}
              {...register("leaveType", {
                required: "Select a leave type",
              })}
            >
              <option value="">
                {isLoadingLeaveTypes ? "Loading leave types..." : "Select a leave type"}
              </option>

              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                  {leaveType.isPaid === false ? " - Unpaid" : ""}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            className="mt-6"
            label="Leave Dates"
            htmlFor="startDate"
            error={errors.startDate?.message || errors.endDate?.message}
            required
          >
            <DateRangePicker
              startDate={parseInputDate(startDate)}
              endDate={parseInputDate(endDate)}
              onChange={handleDateRangeChange}
              triggerClassName={dateRangeTriggerClass}
            />

            {/* Hidden fields so react-hook-form fully owns validation, dirty state, and reset() for these values */}
            <input
              type="hidden"
              {...register("startDate", {
                required: "Start date is required",
                validate: (value) => value >= getTodayInputValue() || "Start date cannot be in the past",
              })}
            />
            <input
              type="hidden"
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

          <div className="mt-6 flex items-center justify-between rounded-lg border border-dashed border-violet-300 bg-violet-50/70 px-4 py-5">
            <span className="text-sm text-slate-600">Calculated Duration:</span>

            <strong className="text-xl text-indigo-600">
              {startDate && endDate
                ? requestedDays === 0.5
                  ? "Half Day"
                  : `${requestedDays} ${requestedDays === 1 ? "Day" : "Days"}`
                : "--"}
            </strong>
          </div>

          {selectedLeaveType?.allowHalfDay && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50/40 px-4 py-3">
              <input
                id="isHalfDay"
                type="checkbox"
                disabled={!isSingleDaySelected}
                className="mt-0.5 size-4 rounded border-violet-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("isHalfDay")}
              />

              <label htmlFor="isHalfDay" className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Request as half day</span>
                <br />
                {isSingleDaySelected
                  ? "This leave type allows half-day requests for a single day."
                  : "Half-day requests are only available when start and end date are the same."}
              </label>
            </div>
          )}

          {startDate && endDate && workingDays === 0 && (
            <p className="mt-2 text-sm text-amber-700">The selected range contains no working days.</p>
          )}

          {hasInsufficientBalance && (
            <p className="mt-2 text-sm text-red-600">
              This request exceeds your currently available balance. HR may reject it or ask you to choose
              unpaid leave.
            </p>
          )}

          <FormField className="mt-6" label="Reason" htmlFor="reason" error={errors.reason?.message} required>
            <textarea
              id="reason"
              rows="4"
              placeholder="Briefly describe the reason for your leave..."
              className={`${getInputClass(Boolean(errors.reason))} min-h-28 resize-y py-3`}
              {...register("reason", {
                required: "Reason is required",
                minLength: {
                  value: 10,
                  message: "Reason must be at least 10 characters",
                },
                maxLength: {
                  value: 500,
                  message: "Reason cannot exceed 500 characters",
                },
              })}
            />
          </FormField>

          <FormField
            className="mt-6"
            label="Supporting Document"
            htmlFor="document"
            error={errors.document?.message}
            optional={!selectedLeaveType?.requiresDocument}
            required={Boolean(selectedLeaveType?.requiresDocument)}
          >
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

                    if (!file) {
                      const currentLeaveTypeId = getValues("leaveType");
                      const currentLeaveType = leaveTypes.find((leaveType) => leaveType.id === currentLeaveTypeId);

                      if (currentLeaveType?.requiresDocument) {
                        return "This leave type requires a supporting document";
                      }

                      return true;
                    }

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
              disabled={isSaving || isLoadingLeaveTypes || hasInsufficientBalance || requestedDays === 0}
              className="h-11 rounded-lg bg-teal-700 px-6 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <BalanceImpactCard
            selectedLeaveType={selectedLeaveType}
            selectedBalance={selectedBalance}
            workingDays={requestedDays}
            availableBalance={availableBalance}
            balanceAfterRequest={balanceAfterRequest}
            balancePercentage={balancePercentage}
            hasInsufficientBalance={hasInsufficientBalance}
            isLoadingBalances={isLoadingBalances}
            isBalancesError={isBalancesError}
          />

          <PolicyHelpCard selectedLeaveType={selectedLeaveType} />

          <TeamAvailabilityCard startDate={startDate} endDate={endDate} workingDays={requestedDays} />
        </aside>
      </div>
    </div>
  );
}

function getInputClass(hasError) {
  return `h-12 w-full rounded-lg border bg-violet-50/40 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? "border-red-500" : "border-violet-200"
    }`;
}

export default ApplyLeavePage;
