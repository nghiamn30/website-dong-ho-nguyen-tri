import * as bcrypt from 'bcryptjs';
import { ROLE_CODES } from './user.types';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  it('keeps the local fallback seeded with hashed passwords and platform roles', async () => {
    const repository = new UsersRepository();

    const [roles, users] = await Promise.all([
      repository.listRoles(),
      repository.listUsers(),
    ]);
    const admin = users.find((user) => user.employeeCode === 'ADMIN001');

    expect(roles.map((role) => role.code)).toEqual([
      ROLE_CODES.ADMIN,
      ROLE_CODES.AUDITOR,
      ROLE_CODES.OPERATOR,
    ]);
    expect(admin?.passwordHash).not.toBe('admin123');
    expect(await bcrypt.compare('admin123', admin?.passwordHash ?? '')).toBe(
      true,
    );
  });

  it('creates, updates, deactivates and resets local users through one contract', async () => {
    const repository = new UsersRepository();

    const created = await repository.createUser({
      id: 'user_test',
      employeeCode: 'TEST001',
      name: 'Test User',
      passwordHash: await bcrypt.hash('secret123', 4),
      roleCodes: [ROLE_CODES.OPERATOR],
      isActive: true,
      createdAt: '2026-04-28T00:00:00.000Z',
      updatedAt: '2026-04-28T00:00:00.000Z',
    });

    expect(created.employeeCode).toBe('TEST001');
    expect(await repository.employeeCodeExists('TEST001')).toBe(true);

    const updated = await repository.updateUser(created.id, {
      name: 'Updated User',
      roleCode: ROLE_CODES.AUDITOR,
    });

    expect(updated.name).toBe('Updated User');
    expect(updated.roleCodes).toEqual([ROLE_CODES.AUDITOR]);

    const inactive = await repository.setUserStatus(created.id, false);
    expect(inactive.isActive).toBe(false);

    const passwordHash = await bcrypt.hash('new-secret', 4);
    const passwordReset = await repository.updatePassword(
      created.id,
      passwordHash,
    );
    expect(passwordReset.passwordHash).toBe(passwordHash);
  });
});
