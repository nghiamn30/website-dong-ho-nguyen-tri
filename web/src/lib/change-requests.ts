import { apiRequest } from "@/lib/auth";

export type ChangeRequestType = "CREATE" | "UPDATE" | "DELETE";
export type ChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ChangeRequestRecord {
  id: string;
  requestedBy: string;
  entityType: string;
  entityId?: string;
  requestType: ChangeRequestType;
  proposedData: Record<string, unknown>;
  reason?: string;
  status: ChangeRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestListFilter {
  status?: ChangeRequestStatus;
  entityType?: string;
  mine?: boolean;
}

export interface CreateChangeRequestPayload {
  entityType: string;
  entityId?: string;
  requestType: ChangeRequestType;
  proposedData: Record<string, unknown>;
  reason?: string;
}

export function getChangeRequests(filter: ChangeRequestListFilter = {}) {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.entityType) params.set("entityType", filter.entityType);
  if (filter.mine) params.set("mine", "true");
  const query = params.toString();
  return apiRequest<ChangeRequestRecord[]>(
    `/change-requests${query ? `?${query}` : ""}`,
  );
}

export function getChangeRequest(id: string) {
  return apiRequest<ChangeRequestRecord>(`/change-requests/${id}`);
}

export function createChangeRequest(payload: CreateChangeRequestPayload) {
  return apiRequest<ChangeRequestRecord>("/change-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveChangeRequest(id: string, reviewNote?: string) {
  return apiRequest<ChangeRequestRecord>(`/change-requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ reviewNote }),
  });
}

export function rejectChangeRequest(id: string, reviewNote?: string) {
  return apiRequest<ChangeRequestRecord>(`/change-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reviewNote }),
  });
}

export const changeRequestStatusLabels: Record<ChangeRequestStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

export const changeRequestTypeLabels: Record<ChangeRequestType, string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xoá",
};
