import apiClient from "../../services/apiClient";

export async function getLeaveTypes(params = {}) {
  const response = await apiClient.get("/leave-types", {
    params,
  });
  return response.data;
}

export async function createLeaveType(payload) {
  const response = await apiClient.post("/leave-types", payload);
  return response.data;
}

export async function updateLeaveType(leaveTypeId, payload) {
  const response = await apiClient.patch(`/leave-types/${leaveTypeId}`, payload);
  return response.data;
}
