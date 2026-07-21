import { createContext, useCallback, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, loginUser, logoutUser } from "../lib/authApi.js";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) return null;
  const role = user.role?.toUpperCase();
  const dashboardPath =
    role === "ADMIN"
      ? "/admin/dashboard"
      : role === "HR"
        ? "/hr/dashboard"
        : "/dashboard";
  return {
    ...user,
    role,
    initials: getInitials(user.name),
    dashboardPath,
  };
}

function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const user = normalizeUser(data?.user);
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      queryClient.setQueryData(["auth", "current-user"], response);
    },
  });
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["auth", "current-user"] });
      queryClient.clear();
    },
  });
  const login = useCallback(async function login(credentials) {
    const response = await loginMutation.mutateAsync(credentials);
    return normalizeUser(response.user);
  }, [loginMutation])
  const logout = useCallback(async function logout() {
    await logoutMutation.mutateAsync();
  }, [logoutMutation])
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth: isLoading || isFetching,
      isLoggingIn: loginMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
      login,
      logout,
      loginError: loginMutation.error,
    }),
    [
      login,
      logout,
      user,
      isLoading,
      isFetching,
      loginMutation.isPending,
      loginMutation.error,
      logoutMutation.isPending,
    ],
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

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export { AuthProvider, useAuth };
