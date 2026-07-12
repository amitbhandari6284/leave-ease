import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import LoginPage from "../pages/auth/LoginPage";
import AppLayout from "../components/layout/AppLayout";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import ApplyLeavePage from "../pages/employee/ApplyLeavePage";
import MyLeavesPage from "../pages/employee/MyLeavesPage";
import HrDashboard from "../pages/hr/HrDashboard";

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
          <Route index element={<Navigate replace to="login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/apply-leave" element={<ApplyLeavePage />} />
            <Route path="/my-leaves" element={<MyLeavesPage />} />
            <Route path="/hr/dashboard" element={<HrDashboard />} />

            {/*
            <Route path="/review-request/:requestId" element={<PlaceholderPage />} />
            <Route path="/calendar" element={<PlaceholderPage />} />
            <Route path="/pending-requests" element={<PlaceholderPage />} />
            <Route path="/users" element={<PlaceholderPage />} />
            <Route path="/policies" element={<PlaceholderPage />} />
            <Route path="/reports" element={<PlaceholderPage />} />
            */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
