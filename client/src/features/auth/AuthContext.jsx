import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const demoUsers = {
  admin: {
    name: "Amit Patel",
    initials: "AP",
    email: "admin@leaveease.com",
    role: "ADMIN",
    dashboardPath: "/admin/dashboard",
  },
  hr: {
    name: "Neha Sharma",
    initials: "NS",
    email: "hr@leaveease.com",
    role: "HR",
    dashboardPath: "/hr/dashboard",
  },
  employee: {
    name: "Marcus Chen",
    initials: "MC",
    email: "employee@leaveease.com",
    role: "EMPLOYEE",
    dashboardPath: "/dashboard",
  },
};

function getInitialUser() {
  const storedUser = sessionStorage.getItem("leaveease-user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem("leaveease-user");
    return null;
  }
}

function getDemoUserFromEmail(email) {
  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail.includes("admin")) return demoUsers.admin;
  if (normalizedEmail.includes("hr")) return demoUsers.hr;

  return demoUsers.employee;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  function login({ email }) {
    const loggedInUser = getDemoUserFromEmail(email);

    setUser(loggedInUser);
    sessionStorage.setItem("leaveease-user", JSON.stringify(loggedInUser));

    return loggedInUser;
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem("leaveease-user");
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuth };
