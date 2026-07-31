import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, PlusCircle, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import SummaryCard from "../../components/ui/SummaryCard";
import Error from "../../components/ui/Error";
import Loader from "../../components/ui/Loader";

import DepartmentModal from "../../features/admin/components/department/DepartmentModal.jsx";
import DepartmentRow, { DepartmentRowHeader } from "../../features/admin/components/department/DepartmentRow.jsx";

import { createDepartment, getDepartments, getUsers, updateDepartment, updateDepartmentStatus } from "../../features/admin/utils/adminApi.js";

async function runMutation(mutationPromise, fallbackMessage) {
  try {
    await mutationPromise;
  } catch (error) {
    throw new Error(error.response?.data?.message || fallbackMessage, {
      cause: error,
    });
  }
}

function DepartmentManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [message, setMessage] = useState("");

  const { data: departmentsData, isLoading: isLoadingDepartments, isError: isDepartmentsError, error: departmentsError, } = useQuery(
    {
      queryKey: ["departments", "all"],
      queryFn: () => getDepartments({ includeInactive: true }),
    });

  const { data: managersData, isLoading: isLoadingManagers, } = useQuery(
    {
      queryKey: ["users", "role", "HR_MANAGER"],
      queryFn: () => getUsers({ role: "HR_MANAGER", limit: 50 }),
    });

  const departments = useMemo(() => normalizeDepartmentsResponse(departmentsData), [departmentsData]);
  const managers = useMemo(() => normalizeManagersResponse(managersData), [managersData]);

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return departments.filter((department) => {
      const matchesSearch =
        !normalizedSearch ||
        department.name.toLowerCase().includes(normalizedSearch) ||
        department.code.toLowerCase().includes(normalizedSearch) ||
        department.managerName.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && department.isActive) ||
        (statusFilter === "Inactive" && !department.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setMessage("Department created successfully.");
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ departmentId, payload }) =>
      updateDepartment(departmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setMessage("Department updated successfully.");
      closeModal();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ departmentId, isActive }) =>
      updateDepartmentStatus(departmentId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setOpenMenuId(null);
      setMessage("Department status updated.");
    },
  });

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest("[data-row-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  function openCreateModal() {
    setEditingDepartment(null);
    setIsModalOpen(true);
  }

  function openEditModal(department) {
    setEditingDepartment(department);
    setOpenMenuId(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingDepartment(null);
  }

  async function handleSaveDepartment(payload) {
    if (editingDepartment) {
      await runMutation(
        updateMutation.mutateAsync({
          departmentId: editingDepartment.id,
          payload,
        }),
        "Unable to update department. Please try again.",
      );
      return;
    }
    await runMutation(
      createMutation.mutateAsync(payload),
      "Unable to create department. Please try again.",
    );
  }

  function toggleDepartmentStatus(department) {
    statusMutation.mutate({
      departmentId: department.id,
      isActive: !department.isActive,
    });
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const departmentStats = useMemo(
    () =>
      departments.reduce(
        (stats, department) => ({
          total: stats.total + 1,
          active: stats.active + (department.isActive ? 1 : 0),
          unassigned: stats.unassigned + (department.managerId ? 0 : 1),
        }),
        { total: 0, active: 0, unassigned: 0 },
      ),
    [departments],
  );

  const summaryCards = [
    {
      label: "Total Departments",
      value: departmentStats.total,
      icon: Building2,
      iconClass: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Active Departments",
      value: departmentStats.active,
      icon: Building2,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Unassigned Managers",
      value: departmentStats.unassigned,
      icon: UserRound,
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  if (isLoadingDepartments) { return (<Loader> Loading departments... </Loader>) }

  if (isDepartmentsError) { return (<Error> {departmentsError?.response?.data?.message || "Unable to load departments."} </Error>) }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Department Management
          </h1>

          <p className="mt-1 text-slate-500">
            Create departments, assign HR managers, and set leave limits.
          </p>
        </div>

        <button
          type="button"
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          onClick={openCreateModal}
        >
          <PlusCircle className="size-4" />
          Add Department
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

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        {summaryCards.map(({ label, value, icon: Icon, iconClass }) => (
          <SummaryCard key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">{label}</p>
                <p className="mt-3 text-4xl font-bold text-slate-950">{value}</p>
              </div>
              <div
                className={`flex size-11 items-center justify-center rounded-full ${iconClass}`}
              >
                <Icon className="size-5" />
              </div>
            </div>
          </SummaryCard>
        ))}
      </section>

      <section className="mt-6 rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative md:col-span-2 xl:col-span-8">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchTerm}
              placeholder="Search departments by name, code, or manager..."
              className="h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            className={`${filterClass} xl:col-span-2`}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="h-11 rounded-lg px-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 xl:col-span-2"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
        <header className="border-b border-violet-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">Departments</h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredDepartments.length} of {departments.length}{" "}
            department{departments.length === 1 ? "" : "s"}.
          </p>
        </header>

        <DepartmentRowHeader />

        <div role="rowgroup">
          {filteredDepartments.map((department, index) => (
            <DepartmentRow
              key={department.id}
              department={department}
              isMenuOpen={openMenuId === department.id}
              isStatusUpdating={statusMutation.isPending}
              openUpward={index >= filteredDepartments.length - 2}
              onToggleMenu={() =>
                setOpenMenuId((currentId) =>
                  currentId === department.id ? null : department.id,
                )
              }
              onEdit={() => openEditModal(department)}
              onToggleStatus={() => toggleDepartmentStatus(department)}
            />
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Building2 className="size-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No departments found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing the selected filters.
            </p>
          </div>
        )}
      </section>

      <DepartmentModal
        isOpen={isModalOpen}
        department={editingDepartment}
        managers={managers}
        isLoadingManagers={isLoadingManagers}
        isSaving={isSaving}
        onClose={closeModal}
        onSave={handleSaveDepartment}
      />
    </div>
  );
}

function normalizeDepartmentsResponse(response) {
  const rawDepartments =
    response?.departments || response?.data?.departments || response?.data || [];

  if (!Array.isArray(rawDepartments)) return [];

  return rawDepartments.map((department) => {
    const manager = department.manager;

    return {
      id: department._id || department.id,
      name: department.name || "Department",
      code: department.code || "",
      description: department.description || "",
      managerId:
        manager?._id || manager?.id || (typeof manager === "string" ? manager : ""),
      managerName: manager?.name || "",
      maximumConcurrentLeaves: department.maximumConcurrentLeaves ?? 3,
      isActive: department.isActive !== false,
      raw: department,
    };
  });
}

function normalizeManagersResponse(response) {
  const rawUsers =
    response?.users || response?.data?.users || response?.data?.docs || response?.data || [];

  if (!Array.isArray(rawUsers)) return [];

  return rawUsers.map((user) => ({
    id: user._id || user.id,
    name: user.name || "User",
  }));
}

const filterClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

export default DepartmentManagementPage;
