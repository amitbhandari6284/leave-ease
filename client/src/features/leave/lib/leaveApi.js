import apiClient from "../../../lib/apiClient";

export async function getMyLeaveRequests(params = {}) {
  const response = await apiClient.get("/leave-requests/me", {
    params,
  });
  return response.data;
}

export async function createLeaveRequest(payload) {
  const response = await apiClient.post("/leave-requests", payload);
  return response.data;
}

export async function cancelLeaveRequest(leaveRequestId, reason) {
  const response = await apiClient.patch(
    `/leave-requests/${leaveRequestId}/cancel`,
    {
      reason,
    },
  );
  return response.data;
}

export async function getLeaveRequestDetail(leaveRequestId) {
  const response = await apiClient.get(`/leave-requests/${leaveRequestId}`);
  return response.data;
}

export async function getReviewQueue(params = {}) {
  const response = await apiClient.get("/leave-requests/review-queue", {
    params,
  });
  return response.data;
}

export async function decideLeaveRequest(leaveRequestId, payload) {
  const response = await apiClient.patch(
    `/leave-requests/${leaveRequestId}/decision`,
    payload,
  );
  return response.data;
}

export async function getMyLeaveBalances(params = {}) {
  const response = await apiClient.get("/leave-balances/me", {
    params,
  });
  return response.data;
}

export async function getLeaveTypes() {
  const response = await apiClient.get("/leave-types");
  return response.data;
}
