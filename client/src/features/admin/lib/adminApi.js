import apiClient from "../../../lib/apiClient";

export async function getUsers(params = {}) {
  const response = await apiClient.get("/users", { params })
  return response.data;
}

export async function createUser(payload) {
  const response = await apiClient.post("/users", payload)
  return response.data
}

export async function updateUser(userId, payload) {
  const response = await apiClient.patch(`/users/${userId}`, payload)
  return response.data
}

export async function updateUserStatus(userId, isActive) {
  const response = await apiClient.patch(`/users/${userId}/status`, { isActive })
  return response.data
}

export async function getDepartments(params = {}) {
  const response = await apiClient.get("/departments", { params })
  return response.data
}
