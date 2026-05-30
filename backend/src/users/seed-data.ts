import { PERMISSIONS, ROLE_CODES, RoleRecord, UserRecord } from './user.types';

const SEED_PASSWORD_HASHES = {
  admin: '$2b$12$YpYJYM24VwIFwIhGcTzmJuc05Yo98GSO4ed/S7DpHCAghnYOcGJ7a',
};

export const seedRoles: RoleRecord[] = [
  {
    code: ROLE_CODES.ADMIN,
    name: 'Quản trị viên',
    permissions: Object.values(PERMISSIONS),
  },
  {
    code: ROLE_CODES.TRUONG_HO,
    name: 'Trưởng họ',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.USERS_CHANGE_OWN_PASSWORD,
      PERMISSIONS.CLAN_MANAGE,
      PERMISSIONS.BRANCHES_MANAGE,
      PERMISSIONS.PERSONS_MANAGE,
      PERMISSIONS.RELATIONSHIPS_MANAGE,
      PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE,
      PERMISSIONS.EVENTS_MANAGE,
      PERMISSIONS.EVENTS_PUBLISH,
      PERMISSIONS.NOTIFICATIONS_MANAGE_OWN,
      PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN,
    ],
  },
  {
    code: ROLE_CODES.TRUONG_CHI,
    name: 'Trưởng chi',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.USERS_CHANGE_OWN_PASSWORD,
      PERMISSIONS.BRANCHES_MANAGE,
      PERMISSIONS.PERSONS_MANAGE,
      PERMISSIONS.RELATIONSHIPS_MANAGE,
      PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE,
      PERMISSIONS.EVENTS_MANAGE,
      PERMISSIONS.NOTIFICATIONS_MANAGE_OWN,
      PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN,
    ],
  },
  {
    code: ROLE_CODES.NGUOI_BINH_THUONG,
    name: 'Người bình thường',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.USERS_CHANGE_OWN_PASSWORD,
      PERMISSIONS.NOTIFICATIONS_MANAGE_OWN,
      PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN,
    ],
  },
];

export function buildSeedUsers(): UserRecord[] {
  const now = new Date().toISOString();

  return [
    {
      id: '00000000-0000-4000-8000-000000000001',
      employeeCode: 'ADMIN001',
      name: 'Quản trị viên hệ thống',
      passwordHash: SEED_PASSWORD_HASHES.admin,
      roleCodes: [ROLE_CODES.ADMIN],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
