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
});
