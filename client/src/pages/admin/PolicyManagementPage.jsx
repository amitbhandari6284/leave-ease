import { useMemo, useState } from "react";
import { Plus, Search, ShieldCheck } from "lucide-react";

import PolicyRow from "../../features/admin/components/PolicyRow";
import PolicyCard from "../../features/admin/components/PolicyCard";
import PolicyOverview from "../../features/admin/components/PolicyOverview";
import GlobalSettings from "../../features/admin/components/GlobalSettings";
import PolicyModal from "../../features/admin/components/PolicyModal";

const initialPolicies = [
  {
    id: 1,
    name: "Annual Leave",
    description: "Standard accrued",
    entitlement: "20",
    unit: "Days/Year",
    status: "Paid",
    type: "Accrual",
    active: true,
    iconType: "annual",
  },
  {
    id: 2,
    name: "Sick Leave",
    description: "Doc req > 3 days",
    entitlement: "10",
    unit: "Days/Year",
    status: "Paid",
    type: "Fixed",
    active: true,
    iconType: "sick",
  },
  {
    id: 3,
    name: "Unpaid Leave",
    description: "Subject to approval",
    entitlement: "Unlimited",
    unit: "",
    status: "Unpaid",
    type: "As needed",
    active: false,
    iconType: "unpaid",
  },
];

function PolicyManagementPage() {
  const [policies, setPolicies] = useState(initialPolicies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [globalSettings, setGlobalSettings] = useState({
    leaveYearStart: "Jan 1st",
    weekendPolicy: "Excluded",
    halfDayRequests: true,
  });
  const [message, setMessage] = useState("");

  const filteredPolicies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return policies.filter((policy) => {
      const matchesSearch =
        !normalizedSearch ||
        policy.name.toLowerCase().includes(normalizedSearch) ||
        policy.description.toLowerCase().includes(normalizedSearch) ||
        policy.type.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || policy.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [policies, searchTerm, statusFilter]);

  const activePolicies = policies.filter((policy) => policy.active).length;

  function openAddModal() {
    setEditingPolicy(null);
    setIsModalOpen(true);
  }

  function openEditModal(policy) {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  }

  function savePolicy(formData) {
    const policyData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      entitlement:
        formData.entitlementMode === "Unlimited"
          ? "Unlimited"
          : formData.entitlement.trim(),
      unit:
        formData.entitlementMode === "Unlimited" ? "" : "Days/Year",
      status: formData.status,
      type: formData.type,
      active: formData.active,
      iconType: formData.iconType,
    };

    if (editingPolicy) {
      setPolicies((currentPolicies) =>
        currentPolicies.map((policy) =>
          policy.id === editingPolicy.id
            ? { ...policy, ...policyData }
            : policy,
        ),
      );

      setMessage("Leave policy updated successfully.");
    } else {
      setPolicies((currentPolicies) => [
        {
          id: Date.now(),
          ...policyData,
        },
        ...currentPolicies,
      ]);

      setMessage("Leave policy created successfully.");
    }

    setIsModalOpen(false);
    setEditingPolicy(null);
  }

  function togglePolicy(policyId) {
    setPolicies((currentPolicies) =>
      currentPolicies.map((policy) =>
        policy.id === policyId
          ? { ...policy, active: !policy.active }
          : policy,
      ),
    );

    setMessage("Policy active status updated.");
  }

  function deletePolicy(policyId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this leave policy?",
    );

    if (!confirmed) return;

    setPolicies((currentPolicies) =>
      currentPolicies.filter((policy) => policy.id !== policyId),
    );

    setMessage("Leave policy deleted.");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Leave Policy Management
          </h1>

          <p className="mt-1 text-slate-500">
            Configure and manage organizational leave policies and entitlements.
          </p>
        </div>

        <button
          type="button"
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          onClick={openAddModal}
        >
          <Plus className="size-4" />
          Add Leave Type
        </button>
      </section>

      {message && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <span>{message}</span>

          <button
            type="button"
            className="font-semibold"
            onClick={() => setMessage("")}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section>
          <div className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Search policies..."
                  className="h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                className="h-11 rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-205 table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-6 py-4 font-semibold">Leave Type</th>
                    <th className="px-6 py-4 font-semibold">Entitlement</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Active</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPolicies.map((policy) => (
                    <PolicyRow
                      key={policy.id}
                      policy={policy}
                      onToggle={() => togglePolicy(policy.id)}
                      onEdit={() => openEditModal(policy)}
                      onDelete={() => deletePolicy(policy.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-violet-100 md:hidden">
              {filteredPolicies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onToggle={() => togglePolicy(policy.id)}
                  onEdit={() => openEditModal(policy)}
                  onDelete={() => deletePolicy(policy.id)}
                />
              ))}
            </div>

            {filteredPolicies.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="size-6" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  No policies found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Try changing the search or status filter.
                </p>
              </div>
            )}

            <footer className="flex flex-col gap-4 border-t border-violet-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredPolicies.length === 0 ? 0 : 1} to{" "}
                {filteredPolicies.length} of {policies.length} entries
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-violet-200 px-3 py-1.5 text-slate-400"
                  disabled
                >
                  Prev
                </button>

                <button
                  type="button"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  className="rounded-lg border border-violet-200 px-3 py-1.5 text-slate-700"
                >
                  Next
                </button>
              </div>
            </footer>
          </section>
        </section>

        <aside className="space-y-6">
          <PolicyOverview
            activePolicies={activePolicies}
            totalPolicies={policies.length}
          />
          <GlobalSettings
            settings={globalSettings}
            onSave={(updatedSettings) => {
              setGlobalSettings(updatedSettings);
              setMessage("Global settings updated successfully.");
            }}
          />
        </aside>
      </div>

      <PolicyModal
        isOpen={isModalOpen}
        policy={editingPolicy}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPolicy(null);
        }}
        onSave={savePolicy}
      />
    </div>
  );
}

export default PolicyManagementPage;
