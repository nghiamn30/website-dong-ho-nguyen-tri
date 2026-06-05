import { apiRequest } from "@/lib/auth";

export interface BranchScopedRoleRecord {
  id: string;
  userId: string;
  roleCode: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignBranchScopePayload {
  userId: string;
  roleCode: string;
  branchId: string;
}

export function getBranchScopes(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiRequest<BranchScopedRoleRecord[]>(`/admin/branch-scopes${query}`);
}

export function assignBranchScope(payload: AssignBranchScopePayload) {
  return apiRequest<BranchScopedRoleRecord>("/admin/branch-scopes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeBranchScope(id: string) {
  return apiRequest<{ id: string }>(`/admin/branch-scopes/${id}`, {
    method: "DELETE",
  });
}
