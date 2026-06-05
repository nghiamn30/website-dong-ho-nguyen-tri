import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { GenealogyService } from '../genealogy/genealogy.service';
import { ChangeRequestsRepository } from './change-requests.repository';
import { ChangeRequestsService } from './change-requests.service';

async function setup() {
  const genealogyRepository = new GenealogyRepository();
  const genealogyService = new GenealogyService(genealogyRepository);
  await genealogyService.upsertClan({ name: 'Dòng họ Nguyễn Trí' });

  const person = await genealogyService.createPerson({
    fullName: 'Nguyễn Văn A',
    gender: 'MALE',
  });

  const repository = new ChangeRequestsRepository();
  const service = new ChangeRequestsService(repository, genealogyService);

  return { service, genealogyService, person };
}

describe('ChangeRequestsService (in-memory)', () => {
  it('creates a pending update request', async () => {
    const { service, person } = await setup();

    const request = await service.create({
      requestedBy: 'user-1',
      entityType: 'person',
      entityId: person.id,
      requestType: 'UPDATE',
      proposedData: { fullName: 'Nguyễn Văn An' },
      reason: 'Sửa chính tả tên',
    });

    expect(request.status).toBe('PENDING');
    expect(request.reason).toBe('Sửa chính tả tên');
  });

  it('requires entityId for UPDATE and rejects it for CREATE', async () => {
    const { service } = await setup();

    await expect(
      service.create({
        requestedBy: 'u',
        entityType: 'person',
        requestType: 'UPDATE',
        proposedData: { fullName: 'X' },
      }),
    ).rejects.toThrow();

    await expect(
      service.create({
        requestedBy: 'u',
        entityType: 'person',
        entityId: 'some-id',
        requestType: 'CREATE',
        proposedData: { fullName: 'X', gender: 'MALE' },
      }),
    ).rejects.toThrow();
  });

  it('applies the change to official data on approval', async () => {
    const { service, genealogyService, person } = await setup();

    const request = await service.create({
      requestedBy: 'user-1',
      entityType: 'person',
      entityId: person.id,
      requestType: 'UPDATE',
      proposedData: { fullName: 'Nguyễn Văn An' },
    });

    const { request: approved, applied } = await service.approve(
      request.id,
      'reviewer-1',
      'Đồng ý',
    );

    expect(approved.status).toBe('APPROVED');
    expect(approved.reviewedBy).toBe('reviewer-1');
    expect(applied.before?.fullName).toBe('Nguyễn Văn A');
    expect(applied.after?.fullName).toBe('Nguyễn Văn An');

    const updated = await genealogyService.getPerson(person.id);
    expect(updated.fullName).toBe('Nguyễn Văn An');
  });

  it('does not change official data on rejection', async () => {
    const { service, genealogyService, person } = await setup();

    const request = await service.create({
      requestedBy: 'user-1',
      entityType: 'person',
      entityId: person.id,
      requestType: 'UPDATE',
      proposedData: { fullName: 'Tên Bị Từ Chối' },
    });

    const rejected = await service.reject(
      request.id,
      'reviewer-1',
      'Không hợp lệ',
    );
    expect(rejected.status).toBe('REJECTED');

    const unchanged = await genealogyService.getPerson(person.id);
    expect(unchanged.fullName).toBe('Nguyễn Văn A');
  });

  it('blocks reviewing a request that is not pending', async () => {
    const { service, person } = await setup();
    const request = await service.create({
      requestedBy: 'user-1',
      entityType: 'person',
      entityId: person.id,
      requestType: 'UPDATE',
      proposedData: { fullName: 'Nguyễn Văn An' },
    });

    await service.approve(request.id, 'reviewer-1', undefined);
    await expect(
      service.reject(request.id, 'reviewer-1', undefined),
    ).rejects.toThrow();
  });
});
