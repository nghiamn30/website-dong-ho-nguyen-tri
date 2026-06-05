import { AuditLogRepository } from './audit-log.repository';

describe('AuditLogRepository', () => {
  it('stores local fallback logs with summary counts and list limit', async () => {
    const repository = new AuditLogRepository();

    await repository.create({
      id: 'log_1',
      action: 'auth.login_failed',
      success: false,
      important: true,
      createdAt: '2026-04-28T00:00:00.000Z',
    });
    await repository.create({
      id: 'log_2',
      action: 'auth.login_success',
      success: true,
      important: true,
      createdAt: '2026-04-28T00:01:00.000Z',
    });

    await expect(repository.list(1)).resolves.toEqual([
      expect.objectContaining({ id: 'log_2' }),
    ]);
    await expect(repository.getSummary()).resolves.toEqual({
      total: 2,
      important: 2,
      failed: 1,
      latestAt: '2026-04-28T00:01:00.000Z',
    });

    repository.trimMemory(1);

    await expect(repository.getSummary()).resolves.toEqual({
      total: 1,
      important: 1,
      failed: 0,
      latestAt: '2026-04-28T00:01:00.000Z',
    });
  });

  it('keeps before/after data and filters by entity and action', async () => {
    const repository = new AuditLogRepository();

    await repository.create({
      id: 'log_a',
      action: 'genealogy.persons.update',
      success: true,
      important: true,
      entityType: 'person',
      entityId: 'p1',
      beforeData: { fullName: 'A' },
      afterData: { fullName: 'B' },
      reason: 'Sửa tên',
      createdAt: '2026-05-01T00:00:00.000Z',
    });
    await repository.create({
      id: 'log_b',
      action: 'change-requests.approve',
      success: true,
      important: true,
      entityType: 'person',
      entityId: 'p2',
      createdAt: '2026-05-01T00:01:00.000Z',
    });

    const byEntity = await repository.list(50, {
      entityType: 'person',
      entityId: 'p1',
    });
    expect(byEntity).toHaveLength(1);
    expect(byEntity[0]).toMatchObject({
      id: 'log_a',
      beforeData: { fullName: 'A' },
      afterData: { fullName: 'B' },
      reason: 'Sửa tên',
    });

    const byAction = await repository.list(50, {
      action: 'change-requests.approve',
    });
    expect(byAction).toHaveLength(1);
    expect(byAction[0].id).toBe('log_b');
  });
});
