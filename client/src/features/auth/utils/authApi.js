import apiClient from "../../../utils/apiClient.js";

export async function loginUser(credentials) {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post("/auth/logout");
  return response.data;
}
