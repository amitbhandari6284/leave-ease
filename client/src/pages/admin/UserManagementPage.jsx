import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";

import SummaryCard from "../../components/ui/SummaryCard";
import UserRow, { UserRowHeader } from "../../features/admin/components/UserRow";
import UserModal from "../../features/admin/components/UserModal";

import { createUser, getDepartments, getUsers, updateUser, updateUserStatus, } from "../../features/admin/lib/adminApi.js";
import { normalizeDepartmentsResponse, normalizeUsersResponse, runMutation } from "../../features/admin/lib/normalize.js"

function UserManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState("");

  const { data: usersData, isLoading: isLoadingUsers, isError: isUsersError, error: usersError, } = useQuery(
    {
      queryKey: ["users"],
      queryFn: () => getUsers({ limit: 50 }),
    });

  const { data: departmentsData, isLoading: isLoadingDepartments, isError: isDepartmentsError, } = useQuery(
    {
      queryKey: ["departments", "all"],
      queryFn: () => getDepartments({ includeInactive: true }),
    });

  const users = useMemo(() => normalizeUsersResponse(usersData), [usersData]);
  const departments = useMemo(() => normalizeDepartmentsResponse(departmentsData), [departmentsData],);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.employeeId.toLowerCase().includes(normalizedSearch) ||
        user.department.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && user.isActive) ||
        (statusFilter === "Inactive" && !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setMessage("User created successfully.");
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setMessage("User updated successfully.");
      closeModal();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpenMenuId(null);
      setMessage("User status updated.");
    },
  });

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest("[data-user-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  function openCreateModal() {
    setEditingUser(null);
    setIsModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setOpenMenuId(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
  }

  async function handleSaveUser(formData) {
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      department: formData.department,
      designation: formData.designation.trim(),
    };
    if (formData.phone.trim()) {
      payload.phone = formData.phone.trim();
    }
    if (editingUser) {
      if (formData.password) {
        payload.password = formData.password;
      }
      await runMutation(
        updateMutation.mutateAsync({ userId: editingUser.id, payload }),
        "Unable to update user. Please try again.",
      );
      return;
    }
    payload.employeeId = formData.employeeId.trim();
    payload.password = formData.password;
    await runMutation(
      createMutation.mutateAsync(payload),
      "Unable to create user. Please try again.",
    );
  }

  function toggleUserStatus(user) {
    statusMutation.mutate({
      userId: user.id,
      isActive: !user.isActive,
    });
  }

  function clearFilters() {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const userStats = useMemo(
    () =>
      users.reduce(
        (stats, user) => ({
          total: stats.total + 1,
          active: stats.active + (user.isActive ? 1 : 0),
          hr: stats.hr + (user.role === "HR_MANAGER" ? 1 : 0),
          employee: stats.employee + (user.role === "EMPLOYEE" ? 1 : 0),
        }),
        { total: 0, active: 0, hr: 0, employee: 0 },
      ),
    [users],
  );

  const summaryCards = [
    {
      label: "Total Users",
      value: userStats.total,
      icon: Users,
      iconClass: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Active Users",
      value: userStats.active,
      icon: UserRound,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "HR Users",
      value: userStats.hr,
      icon: ShieldCheck,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Employees",
      value: userStats.employee,
      icon: Users,
      iconClass: "bg-sky-100 text-sky-700",
    },
  ];

  if (isLoadingUsers) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-violet-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  if (isUsersError) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">
            {usersError?.response?.data?.message || "Unable to load users."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            User Management
          </h1>

          <p className="mt-1 text-slate-500">
            Create users, assign roles, and manage account access.
          </p>
        </div>

        <button
          type="button"
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          onClick={openCreateModal}
        >
          <UserPlus className="size-4" />
          Add User
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

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="relative md:col-span-2 xl:col-span-6">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchTerm}
              placeholder="Search users by name, email, ID, or department..."
              className="h-11 w-full rounded-lg border border-violet-200 bg-violet-50/40 pr-4 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            className={`${filterClass} xl:col-span-2`}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="ADMIN">Admin</option>
          </select>

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
          <h2 className="text-xl font-bold text-slate-950">Users</h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredUsers.length} of {users.length} account
            {users.length === 1 ? "" : "s"}.
          </p>
        </header>

        <UserRowHeader />

        <div>
          {filteredUsers.map((user, index) => (
            <UserRow
              key={user.id}
              user={user}
              isMenuOpen={openMenuId === user.id}
              isStatusUpdating={statusMutation.isPending}
              openUpward={index >= filteredUsers.length - 2}
              onToggleMenu={() =>
                setOpenMenuId((currentId) =>
                  currentId === user.id ? null : user.id,
                )
              }
              onEdit={() => openEditModal(user)}
              onToggleStatus={() => toggleUserStatus(user)}
            />
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Users className="size-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No users found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing the selected filters.
            </p>
          </div>
        )}
      </section>

      <UserModal
        isOpen={isModalOpen}
        user={editingUser}
        departments={departments}
        isLoadingDepartments={isLoadingDepartments}
        isDepartmentsError={isDepartmentsError}
        isSaving={isSaving}
        onClose={closeModal}
        onSave={handleSaveUser}
      />
    </div>
  );
}

const filterClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

export default UserManagementPage;
