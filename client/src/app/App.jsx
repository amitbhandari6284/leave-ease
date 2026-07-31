import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import AppLayout from "../components/layout/AppLayout";

import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import PublicRoute from "../features/auth/components/PublicRoute";

import AdminDashboard from "../pages/dashboard/AdminDashboard";
import DepartmentManagementPage from "../pages/admin/DepartmentManagementPage";
import PolicyManagementPage from "../pages/admin/PolicyManagementPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import LoginPage from "../pages/auth/LoginPage";
import ApplyLeavePage from "../pages/employee/ApplyLeavePage";
import EmployeeDashboard from "../pages/dashboard/EmployeeDashboard";
import MyLeavesPage from "../pages/employee/MyLeavesPage";
import DepartmentCalendarPage from "../pages/hr/DepartmentCalendarPage";
import HrDashboard from "../pages/dashboard/HrDashboard";
import PendingRequestsPage from "../pages/hr/PendingRequestsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />} >
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE", "HR_MANAGER"]} />}>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
              <Route path="/my-leaves" element={<MyLeavesPage />} />
              <Route path="/apply-leave" element={<ApplyLeavePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["HR_MANAGER", "ADMIN"]} />}>
              <Route path="/hr/dashboard" element={<HrDashboard />} />
              <Route path="/calendar" element={<DepartmentCalendarPage />} />
              <Route path="/pending-requests" element={<PendingRequestsPage />} />
              <Route
                path="/pending-requests/:requestId"
                element={<PendingRequestsPage />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/departments" element={<DepartmentManagementPage />} />
              <Route path="/policies" element={<PolicyManagementPage />} />
              {/* <Route path="/reports" element={<PlaceholderPage />} /> */}
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
