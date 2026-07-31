import apiClient from "./apiClient";

export async function getNotification() {
  const response = await apiClient.get("/notifications")
  return response.data
}

