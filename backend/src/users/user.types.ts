export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  USERS_CHANGE_OWN_PASSWORD: 'users.change-own-password',
  AUDIT_LOGS_VIEW: 'audit-logs.view',
} as const;

export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  AUDITOR: 'AUDITOR',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export interface RoleRecord {
  code: RoleCode;
  name: string;
  permissions: PermissionCode[];
}

export interface UserRecord {
  id: string;
  employeeCode: string;
  name: string;
  passwordHash: string;
  roleCodes: RoleCode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserManagementRecord {
  id: string;
  employeeCode: string;
  name: string;
  roles: Array<{
    code: RoleCode;
    name: string;
    permissions: PermissionCode[];
  }>;
  permissions: PermissionCode[];
  defaultPath: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
