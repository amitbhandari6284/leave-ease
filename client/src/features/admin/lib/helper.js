const ROLE_LABELS = {
  ADMIN: "Admin",
  HR: "HR",
  EMPLOYEE: "Employee",
};
export function formatRoleLabel(role) {
  return ROLE_LABELS[role] ?? "Employee";
}
