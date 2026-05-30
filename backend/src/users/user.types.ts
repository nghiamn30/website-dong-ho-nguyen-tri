export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  USERS_CHANGE_OWN_PASSWORD: 'users.change-own-password',
  AUDIT_LOGS_VIEW: 'audit-logs.view',
  CLAN_MANAGE: 'clan.manage',
  BRANCHES_MANAGE: 'branches.manage',
  PERSONS_MANAGE: 'persons.manage',
  RELATIONSHIPS_MANAGE: 'relationships.manage',
  DEATH_ANNIVERSARIES_MANAGE: 'death-anniversaries.manage',
  EVENTS_MANAGE: 'events.manage',
  EVENTS_PUBLISH: 'events.publish',
  NOTIFICATIONS_MANAGE_OWN: 'notifications.manage-own',
  REMINDER_SETTINGS_MANAGE_OWN: 'reminder-settings.manage-own',
} as const;

export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  TRUONG_HO: 'TRUONG_HO',
  TRUONG_CHI: 'TRUONG_CHI',
  NGUOI_BINH_THUONG: 'NGUOI_BINH_THUONG',
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
  personId?: string;
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
