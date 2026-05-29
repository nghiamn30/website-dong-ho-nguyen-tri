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
    code: ROLE_CODES.OPERATOR,
    name: 'Vận hành hệ thống',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.USERS_CHANGE_OWN_PASSWORD,
    ],
  },
  {
    code: ROLE_CODES.AUDITOR,
    name: 'Theo dõi nhật ký',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.USERS_CHANGE_OWN_PASSWORD,
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
