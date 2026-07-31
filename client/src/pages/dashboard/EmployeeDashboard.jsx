import { useQuery } from "@tanstack/react-query";

import Error from "../../components/ui/Error.jsx";
import Loader from "../../components/ui/Loader.jsx";

import { LeaveBalanceCard } from "../../features/dashboard/components/LeaveBalanceCard.jsx";
import LeaveBalanceCards from "../../features/dashboard/components/LeaveBalanceCards.jsx";
import { UpcomingApprovedApplications } from "../../features/dashboard/components/UpcomingApproved.jsx";
import { UpcomingHolidays } from "../../features/dashboard/components/UpcomingHolidays.jsx";
import Welcome from "../../features/dashboard/components/Welcome.jsx";

import { normalizeDashboardSummary } from "../../features/dashboard/utils/normalizeApiData.js";
import { getDashboardSummary } from "../../utils/dashboardApi.js";

function EmployeeDashboard() {
  const { data: dashboardData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => getDashboardSummary()
  })
  const normalizedDashboardData = normalizeDashboardSummary(dashboardData)

  if (isLoading) return (<Loader>Loading dashboard... </Loader>)

  if (isError) return (<Error>{error?.response?.data?.message || "Unable to load dashboard."}</Error>)

  return (
    <div className="mx-auto max-w-7xl">
      <Welcome />
      <LeaveBalanceCards>
        {normalizedDashboardData.leaveBalances.map((leave) => (
          <LeaveBalanceCard key={leave.leaveTypeName} leave={leave} />
        ))}
      </LeaveBalanceCards>
      <UpcomingApprovedApplications applications={normalizedDashboardData.upcomingApprovedApplications} />
      <UpcomingHolidays holidays={normalizedDashboardData.upcomingHolidays} />
    </div>
  );
}


export default EmployeeDashboard;
