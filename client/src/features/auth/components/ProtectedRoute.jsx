import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.dashboardPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
