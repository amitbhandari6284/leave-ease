export async function runMutation(mutationPromise, fallbackMessage) {
  try {
    await mutationPromise;
  } catch (error) {
    throw new Error(error.response?.data?.message || fallbackMessage, {
      cause: error,
    });
  }
}

export function normalizeUsersResponse(response) {
  const rawUsers =
    response?.users ||
    response?.data?.users ||
    response?.data?.docs ||
    response?.data ||
    [];

  if (!Array.isArray(rawUsers)) return [];

  return rawUsers.map((user) => {
    const department = user.department;

    return {
      id: user._id || user.id,
      name: user.name || "User",
      email: user.email || "",
      employeeId: user.employeeId || user.employeeCode || "—",
      role: formatRole(user.role),
      departmentId:
        department?._id ||
        department?.id ||
        (typeof department === "string" ? department : ""),
      department:
        department?.name ||
        user.departmentName ||
        (typeof department === "string" ? department : "Unassigned"),
      designation: user.designation || "Employee",
      phone: user.phone || "",
      isActive: user.isActive !== false,
      raw: user,
    };
  });
}

export function normalizeDepartmentsResponse(response) {
  const rawDepartments =
    response?.departments ||
    response?.data?.departments ||
    response?.data ||
    [];

  if (!Array.isArray(rawDepartments)) return [];

  return rawDepartments.map((department) => ({
    id: department._id || department.id,
    name: department.name || "Department",
    code: department.code || "",
    isActive: department.isActive !== false,
  }));
}

export function formatRole(role = "") {
  const normalized = role.toUpperCase();

  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "HR_MANAGER" || normalized === "HR") return "HR_MANAGER";

  return "EMPLOYEE";
}
