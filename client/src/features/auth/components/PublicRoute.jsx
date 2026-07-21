import { Navigate, Outlet } from "react-router";

import { useAuth } from "./AuthContext";
import AuthLoader from "./AuthLoader";

export default function PublicRoute() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <AuthLoader />
    )
  }
  if (isAuthenticated) {
    return <Navigate to={user.dashboardPath} replace />
  }
  return (
    <Outlet />
  )
}

