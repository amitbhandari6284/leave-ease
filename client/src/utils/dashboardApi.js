import apiClient from "./apiClient.js";

export async function getDashboardSummary() {
  const response = await apiClient.get("/dashboard/summary");
  return response.data
}
