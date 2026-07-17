import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";

import SummaryCard from "../../components/ui/SummaryCard";
import UserRow from "../../features/admin/UserRow";
import UserCard from "../../features/admin/UserCard";
import AddUserModal from "../../features/admin/AddUserModal";

const initialUsers = [
  {
    id: 1,
    name: "Amit Patel",
    email: "amit.patel@leaveease.com",
    employeeId: "EMP-001",
    role: "Admin",
    department: "Administration",
    designation: "System Administrator",
    status: "Active",
  },
  {
    id: 2,
    name: "Neha Sharma",
    email: "neha.sharma@leaveease.com",
    employeeId: "EMP-014",
    role: "HR",
    department: "Human Resources",
    designation: "HR Manager",
    status: "Active",
  },
  {
    id: 3,
    name: "Marcus Chen",
    email: "marcus.chen@leaveease.com",
    employeeId: "EMP-028",
    role: "Employee",
    department: "Engineering",
    designation: "Senior Frontend Engineer",
    status: "Active",
  },
  {
    id: 4,
    name: "Amanda Lee",
    email: "amanda.lee@leaveease.com",
    employeeId: "EMP-033",
    role: "Employee",
    department: "Marketing",
    designation: "Marketing Specialist",
    status: "Active",
  },
  {
    id: 5,
    name: "David Okafor",
    email: "david.okafor@leaveease.com",
    employeeId: "EMP-041",
    role: "Employee",
    department: "Finance",
    designation: "Financial Analyst",
    status: "Inactive",
  },
];

function UserManagementPage() {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [message, setMessage] = useState("");

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
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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

  function addUser(formData) {
    const newUser = {
      id: Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      employeeId: formData.employeeId.trim(),
      role: formData.role,
      department: formData.department.trim(),
      designation: formData.designation.trim(),
      status: "Active",
    };

    setUsers((currentUsers) => [newUser, ...currentUsers]);
    setIsAddUserOpen(false);
    setMessage("User created successfully.");
  }

  function toggleUserStatus(userId) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
            ...user,
            status: user.status === "Active" ? "Inactive" : "Active",
          }
          : user,
      ),
    );

    setOpenMenuId(null);
    setMessage("User status updated.");
  }

  function clearFilters() {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
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
          onClick={() => setIsAddUserOpen(true)}
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

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        <SummaryCard>
          <p className="text-sm font-semibold text-slate-600">Total Users</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{users.length}</p>
        </SummaryCard>

        <SummaryCard>
          <p className="text-sm font-semibold text-slate-600">Active Users</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{users.filter((user) => user.status === "Active").length}</p>
        </SummaryCard>

        <SummaryCard>
          <p className="text-sm font-semibold text-slate-600">Admins / HR</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">{users.filter((user) => user.role !== "Employee").length}</p>
        </SummaryCard>
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
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
            <option value="Employee">Employee</option>
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

      <section className="mt-6 overflow-visible rounded-xl border border-violet-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-262.5 table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[27%]" />
              <col className="w-[15%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-violet-200 bg-violet-50 text-xs uppercase tracking-wide text-slate-600">
                <th className="whitespace-nowrap px-6 py-4 font-semibold">
                  User
                </th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">
                  Employee ID
                </th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">
                  Department
                </th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">
                  Role
                </th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">
                  Status
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user, index) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isMenuOpen={openMenuId === user.id}
                  openUpward={index === filteredUsers.length - 1}
                  onToggleMenu={() =>
                    setOpenMenuId((currentId) =>
                      currentId === user.id ? null : user.id,
                    )
                  }
                  onToggleStatus={() => toggleUserStatus(user.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-violet-100 md:hidden">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onToggleStatus={() => toggleUserStatus(user.id)}
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

      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={addUser}
      />
    </div>
  );
}


// this is for testing purpose 


const filterClass =
  "h-11 w-full rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";


export default UserManagementPage;
