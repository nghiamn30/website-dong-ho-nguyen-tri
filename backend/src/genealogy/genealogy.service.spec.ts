import { GenealogyRepository } from './genealogy.repository';
import { GenealogyService } from './genealogy.service';
import type { CreatePersonDto } from './dto/genealogy.dto';

function makeService() {
  const repository = new GenealogyRepository();
  const service = new GenealogyService(repository);
  return { repository, service };
}

async function createPerson(
  service: GenealogyService,
  overrides: Partial<CreatePersonDto> & { fullName: string; gender: string },
) {
  return service.createPerson(overrides);
}

describe('GenealogyService (in-memory)', () => {
  let service: GenealogyService;

  beforeEach(async () => {
    ({ service } = makeService());
    await service.upsertClan({ name: 'Dòng họ Nguyễn Trí' });
  });

  describe('clan + founder', () => {
    it('keeps a single clan and sets the founder', async () => {
      const founder = await createPerson(service, {
        fullName: 'Nguyễn Trí Thủy Tổ',
        gender: 'MALE',
        generationNumber: 1,
      });

      const clan = await service.upsertClan({
        name: 'Dòng họ Nguyễn Trí',
        founderPersonId: founder.id,
      });

      expect(clan.founderPersonId).toBe(founder.id);
      expect(clan.singletonKey).toBe(true);
    });

    it('blocks creating a person before the clan exists', async () => {
      const { service: emptyService } = makeService();
      await expect(
        createPerson(emptyService, { fullName: 'Không họ', gender: 'MALE' }),
      ).rejects.toThrow();
    });
  });

  describe('persons', () => {
    it('does not keep death data for a living person', async () => {
      const person = await createPerson(service, {
        fullName: 'Người Sống',
        gender: 'FEMALE',
        lifeStatus: 'LIVING',
        deathSolarDate: '2020-01-01',
        burialPlace: 'Nghĩa trang',
      });

      expect(person.deathSolarDate).toBeUndefined();
      expect(person.burialPlace).toBeUndefined();
    });

    it('keeps death data for a deceased person', async () => {
      const person = await createPerson(service, {
        fullName: 'Người Đã Mất',
        gender: 'MALE',
        lifeStatus: 'DECEASED',
        deathSolarDate: '2020-05-20',
      });

      expect(person.lifeStatus).toBe('DECEASED');
      expect(person.deathSolarDate).toBe('2020-05-20');
      expect(person.deathDateSource).toBe('SOLAR');
    });

    it('rejects a death date earlier than the birth date', async () => {
      await expect(
        createPerson(service, {
          fullName: 'Sai Ngày',
          gender: 'MALE',
          lifeStatus: 'DECEASED',
          birthSolarDate: '1950-01-01',
          deathSolarDate: '1940-01-01',
        }),
      ).rejects.toThrow();
    });
  });

  describe('parent-child relations', () => {
    it('attaches a biological father and mother', async () => {
      const father = await createPerson(service, {
        fullName: 'Cha',
        gender: 'MALE',
      });
      const mother = await createPerson(service, {
        fullName: 'Mẹ',
        gender: 'FEMALE',
      });
      const child = await createPerson(service, {
        fullName: 'Con',
        gender: 'MALE',
      });

      await service.createParentChild({
        parentPersonId: father.id,
        childPersonId: child.id,
        parentRole: 'FATHER',
      });
      await service.createParentChild({
        parentPersonId: mother.id,
        childPersonId: child.id,
        parentRole: 'MOTHER',
      });

      const relations = await service.getPersonRelations(child.id);
      expect(relations.parents).toHaveLength(2);
    });

    it('rejects a female father', async () => {
      const father = await createPerson(service, {
        fullName: 'Nữ',
        gender: 'FEMALE',
      });
      const child = await createPerson(service, {
        fullName: 'Con',
        gender: 'MALE',
      });

      await expect(
        service.createParentChild({
          parentPersonId: father.id,
          childPersonId: child.id,
          parentRole: 'FATHER',
        }),
      ).rejects.toThrow();
    });

    it('rejects two biological fathers for one child', async () => {
      const father1 = await createPerson(service, {
        fullName: 'Cha 1',
        gender: 'MALE',
      });
      const father2 = await createPerson(service, {
        fullName: 'Cha 2',
        gender: 'MALE',
      });
      const child = await createPerson(service, {
        fullName: 'Con',
        gender: 'MALE',
      });

      await service.createParentChild({
        parentPersonId: father1.id,
        childPersonId: child.id,
        parentRole: 'FATHER',
      });

      await expect(
        service.createParentChild({
          parentPersonId: father2.id,
          childPersonId: child.id,
          parentRole: 'FATHER',
        }),
      ).rejects.toThrow();
    });

    it('rejects a self relation', async () => {
      const person = await createPerson(service, {
        fullName: 'Tự',
        gender: 'MALE',
      });
      await expect(
        service.createParentChild({
          parentPersonId: person.id,
          childPersonId: person.id,
          parentRole: 'FATHER',
        }),
      ).rejects.toThrow();
    });

    it('rejects a cycle in the ancestry', async () => {
      const a = await createPerson(service, {
        fullName: 'Ông A',
        gender: 'MALE',
      });
      const b = await createPerson(service, {
        fullName: 'Ông B',
        gender: 'MALE',
      });

      await service.createParentChild({
        parentPersonId: a.id,
        childPersonId: b.id,
        parentRole: 'FATHER',
      });

      await expect(
        service.createParentChild({
          parentPersonId: b.id,
          childPersonId: a.id,
          parentRole: 'FATHER',
        }),
      ).rejects.toThrow();
    });
  });

  describe('marriages', () => {
    it('rejects a marriage where the husband is not male', async () => {
      const husband = await createPerson(service, {
        fullName: 'Người X',
        gender: 'FEMALE',
      });
      const wife = await createPerson(service, {
        fullName: 'Người Y',
        gender: 'FEMALE',
      });

      await expect(
        service.createMarriage({
          husbandPersonId: husband.id,
          wifePersonId: wife.id,
        }),
      ).rejects.toThrow();
    });

    it('creates a valid marriage and rejects duplicates', async () => {
      const husband = await createPerson(service, {
        fullName: 'Chồng',
        gender: 'MALE',
      });
      const wife = await createPerson(service, {
        fullName: 'Vợ',
        gender: 'FEMALE',
      });

      const marriage = await service.createMarriage({
        husbandPersonId: husband.id,
        wifePersonId: wife.id,
      });
      expect(marriage.status).toBe('ACTIVE');

      await expect(
        service.createMarriage({
          husbandPersonId: husband.id,
          wifePersonId: wife.id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('family tree', () => {
    it('builds the tree from the founder with spouses and children', async () => {
      const founder = await createPerson(service, {
        fullName: 'Thủy Tổ',
        gender: 'MALE',
        generationNumber: 1,
      });
      const wife = await createPerson(service, {
        fullName: 'Bà Thủy Tổ',
        gender: 'FEMALE',
        generationNumber: 1,
      });
      const son = await createPerson(service, {
        fullName: 'Con Trai',
        gender: 'MALE',
        generationNumber: 2,
      });

      await service.upsertClan({
        name: 'Dòng họ Nguyễn Trí',
        founderPersonId: founder.id,
      });
      await service.createMarriage({
        husbandPersonId: founder.id,
        wifePersonId: wife.id,
      });
      await service.createParentChild({
        parentPersonId: founder.id,
        childPersonId: son.id,
        parentRole: 'FATHER',
      });

      const tree = await service.getFamilyTree({});

      expect(tree.rootPersonId).toBe(founder.id);
      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].spouses.map((spouse) => spouse.person.id)).toContain(
        wife.id,
      );
      expect(tree.nodes[0].children.map((child) => child.person.id)).toContain(
        son.id,
      );
    });
  });

  describe('branch leadership', () => {
    it('auto-transfers leadership to the senior living son', async () => {
      const clan = await service.getClan();
      const branch = await service.createBranch({ name: 'Chi Nhất' });

      const head = await createPerson(service, {
        fullName: 'Trưởng Chi',
        gender: 'MALE',
        branchId: branch.id,
      });
      const son = await createPerson(service, {
        fullName: 'Con Trưởng',
        gender: 'MALE',
        branchId: branch.id,
        birthSolarDate: '1980-01-01',
      });

      await service.createParentChild({
        parentPersonId: head.id,
        childPersonId: son.id,
        parentRole: 'FATHER',
      });

      // Assign the initial head.
      await service.transferLeadership(branch.id, {
        successorPersonId: head.id,
      });
      // Auto transfer should pick the living son.
      const updated = await service.transferLeadership(branch.id, {});

      expect(updated.headPersonId).toBe(son.id);

      const history = await service.getLeadershipHistory(branch.id);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(clan).not.toBeNull();
    });

    it('blocks setting a head who does not belong to the branch', async () => {
      const branch = await service.createBranch({ name: 'Chi Hai' });
      const outsider = await createPerson(service, {
        fullName: 'Người Ngoài Chi',
        gender: 'MALE',
      });

      await expect(
        service.transferLeadership(branch.id, {
          successorPersonId: outsider.id,
        }),
      ).rejects.toThrow();
    });
  });
});
