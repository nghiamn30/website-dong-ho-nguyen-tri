export const BRANCH_SCOPE_PERMISSIONS = {
  MANAGE: 'roles.manage-branch-scope',
} as const;

/**
 * Vai trò có phạm vi toàn họ (không bị giới hạn theo branch_id).
 * Admin và trưởng họ thao tác trên toàn bộ dữ liệu.
 */
export const UNRESTRICTED_ROLE_CODES = ['ADMIN', 'TRUONG_HO'] as const;

export interface BranchScopedRoleRecord {
  id: string;
  userId: string;
  roleCode: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchScopedRoleInput {
  userId: string;
  roleCode: string;
  branchId: string;
}

/**
 * Kết quả tính phạm vi của một user.
 * - `unrestricted = true`: toàn họ (admin/trưởng họ).
 * - ngược lại: chỉ các `branchIds` (đã gồm chi con).
 */
export interface ResolvedBranchScope {
  unrestricted: boolean;
  branchIds: Set<string>;
}
