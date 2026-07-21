import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import AuthLoader from "./AuthLoader";

function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <AuthLoader />
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.dashboardPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
