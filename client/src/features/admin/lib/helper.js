const ROLE_LABELS = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  EMPLOYEE: "Employee",
};
export function formatRoleLabel(role) {
  return ROLE_LABELS[role] ?? "Employee";
}
