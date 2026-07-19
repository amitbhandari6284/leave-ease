import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import LoginPage from "../pages/auth/LoginPage";
import AppLayout from "../components/layout/AppLayout";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import ApplyLeavePage from "../pages/employee/ApplyLeavePage";
import MyLeavesPage from "../pages/employee/MyLeavesPage";
import HrDashboard from "../pages/hr/HrDashboard";
import PendingRequestsPage from "../pages/hr/PendingRequestsPage";
import DepartmentCalendarPage from "../pages/hr/DepartmentCalendarPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagementPage from "../pages/admin/UserManagementPage";
import PolicyManagementPage from "../pages/admin/PolicyManagementPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE", "HR"]} />}>
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="/my-leaves" element={<MyLeavesPage />} />
                <Route path="/apply-leave" element={<ApplyLeavePage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]} />}>
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
                <Route path="/policies" element={<PolicyManagementPage />} />
                {/* <Route path="/reports" element={<PlaceholderPage />} /> */}
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
