import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { GenealogyService } from '../genealogy/genealogy.service';
import { BranchScopeRepository } from './branch-scope.repository';
import {
  BranchScopeService,
  expandWithDescendants,
  ScopeActor,
} from './branch-scope.service';

const ADMIN: ScopeActor = { id: 'admin', roles: [{ code: 'ADMIN' }] };
const TRUONG_HO: ScopeActor = { id: 'th', roles: [{ code: 'TRUONG_HO' }] };

function makeChi(id: string): ScopeActor {
  return { id, roles: [{ code: 'TRUONG_CHI' }] };
}

async function setup() {
  const genealogyRepository = new GenealogyRepository();
  const genealogyService = new GenealogyService(genealogyRepository);
  await genealogyService.upsertClan({ name: 'Dòng họ Nguyễn Trí' });

  const parent = await genealogyService.createBranch({ name: 'Chi Giáp' });
  const child = await genealogyService.createBranch({
    name: 'Nhánh Giáp 1',
    parentBranchId: parent.id,
  });
  const other = await genealogyService.createBranch({ name: 'Chi Ất' });

  const scopeRepository = new BranchScopeRepository();
  const service = new BranchScopeService(scopeRepository, genealogyRepository);

  return { service, scopeRepository, parent, child, other };
}

describe('BranchScopeService (in-memory)', () => {
  it('treats admin and trưởng họ as unrestricted', async () => {
    const { service } = await setup();

    expect(service.isUnrestricted(ADMIN)).toBe(true);
    expect(service.isUnrestricted(TRUONG_HO)).toBe(true);
    await expect(service.canActOnBranch(ADMIN, null)).resolves.toBe(true);
    await expect(service.canActOnBranch(TRUONG_HO, 'any-branch')).resolves.toBe(
      true,
    );
  });

  it('resolves a trưởng chi scope to assigned branch plus descendants', async () => {
    const { service, parent, child, other } = await setup();
    const chi = makeChi('chi-user');

    await service.assignScope({
      userId: chi.id,
      roleCode: 'TRUONG_CHI',
      branchId: parent.id,
    });

    const scope = await service.resolveScope(chi);
    expect(scope.unrestricted).toBe(false);
    expect(scope.branchIds.has(parent.id)).toBe(true);
    expect(scope.branchIds.has(child.id)).toBe(true);
    expect(scope.branchIds.has(other.id)).toBe(false);
  });

  it('allows acting inside scope and blocks outside scope', async () => {
    const { service, parent, child, other } = await setup();
    const chi = makeChi('chi-user');
    await service.assignScope({
      userId: chi.id,
      roleCode: 'TRUONG_CHI',
      branchId: parent.id,
    });

    await expect(
      service.assertCanActOnBranch(chi, parent.id),
    ).resolves.toBeUndefined();
    await expect(
      service.assertCanActOnBranch(chi, child.id),
    ).resolves.toBeUndefined();
    await expect(service.assertCanActOnBranch(chi, other.id)).rejects.toThrow();
    // Người không có chi nào được gán: chặn cả thành viên không thuộc chi.
    await expect(service.assertCanActOnBranch(chi, null)).rejects.toThrow();
  });

  it('rejects assigning scope to unrestricted roles', async () => {
    const { service, parent } = await setup();
    await expect(
      service.assignScope({
        userId: 'x',
        roleCode: 'TRUONG_HO',
        branchId: parent.id,
      }),
    ).rejects.toThrow();
  });

  it('rejects duplicate scope assignment', async () => {
    const { service, parent } = await setup();
    await service.assignScope({
      userId: 'chi',
      roleCode: 'TRUONG_CHI',
      branchId: parent.id,
    });
    await expect(
      service.assignScope({
        userId: 'chi',
        roleCode: 'TRUONG_CHI',
        branchId: parent.id,
      }),
    ).rejects.toThrow();
  });
});

describe('expandWithDescendants', () => {
  it('includes nested descendants without infinite loop', () => {
    const branches = [
      { id: 'a', parentBranchId: undefined },
      { id: 'b', parentBranchId: 'a' },
      { id: 'c', parentBranchId: 'b' },
      { id: 'd', parentBranchId: undefined },
    ] as Parameters<typeof expandWithDescendants>[1];

    const result = expandWithDescendants(['a'], branches);
    expect([...result].sort()).toEqual(['a', 'b', 'c']);
  });
});
