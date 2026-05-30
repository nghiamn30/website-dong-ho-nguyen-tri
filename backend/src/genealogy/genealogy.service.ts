import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateBranchDto,
  CreateMarriageDto,
  CreateParentChildDto,
  CreatePersonDto,
  TransferLeadershipDto,
  UpdateBranchDto,
  UpdateMarriageDto,
  UpdatePersonDto,
  UpsertClanDto,
} from './dto/genealogy.dto';
import { GenealogyRepository, PersonWriteModel } from './genealogy.repository';
import {
  BranchRecord,
  BranchTreeNode,
  CalendarType,
  ClanRecord,
  FamilyTreeNode,
  FamilyTreeRecord,
  FamilyTreeSpouse,
  Gender,
  LifeStatus,
  MarriageRecord,
  MarriageStatus,
  ParentChildRelationRecord,
  ParentRelationType,
  ParentRole,
  PersonRecord,
  PersonRelationsRecord,
} from './genealogy.types';

@Injectable()
export class GenealogyService {
  constructor(private readonly repository: GenealogyRepository) {}

  // ----- Clan -----

  getClan() {
    return this.repository.getClan();
  }

  async upsertClan(dto: UpsertClanDto) {
    if (dto.founderPersonId) {
      const founder = await this.findPersonOrThrow(dto.founderPersonId);
      const clan = await this.repository.getClan();
      if (clan && founder.clanId !== clan.id) {
        throw new BadRequestException({
          code: 'FOUNDER_WRONG_CLAN',
          message: 'Thủy tổ phải thuộc đúng dòng họ.',
        });
      }
    }

    return this.repository.upsertClan({
      name: dto.name.trim(),
      description: optionalText(dto.description),
      history: optionalText(dto.history),
      founderPersonId: dto.founderPersonId,
      logoUrl: optionalText(dto.logoUrl),
      bannerUrl: optionalText(dto.bannerUrl),
      ancestralHouseName: optionalText(dto.ancestralHouseName),
      ancestralHouseAddress: optionalText(dto.ancestralHouseAddress),
      contactInformation: optionalText(dto.contactInformation),
    });
  }

  // ----- Branches -----

  listBranches() {
    return this.repository.listBranches();
  }

  async getBranchTree(): Promise<BranchTreeNode[]> {
    const branches = await this.repository.listBranches();
    return buildBranchTree(branches);
  }

  async createBranch(dto: CreateBranchDto) {
    const clan = await this.findClanOrThrow();

    if (dto.parentBranchId) {
      await this.findBranchOrThrow(dto.parentBranchId);
    }

    return this.repository.createBranch({
      clanId: clan.id,
      parentBranchId: dto.parentBranchId ?? null,
      name: dto.name.trim(),
      type: normalizeText(dto.type) ?? 'Chi',
      description: normalizeText(dto.description),
      headPersonId: null,
      displayOrder: dto.displayOrder ?? 0,
    });
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    await this.findBranchOrThrow(id);

    if (dto.parentBranchId !== undefined && dto.parentBranchId !== null) {
      if (dto.parentBranchId === id) {
        throw new BadRequestException({
          code: 'INVALID_PARENT_BRANCH',
          message: 'Chi/nhánh không thể là cha của chính nó.',
        });
      }
      await this.findBranchOrThrow(dto.parentBranchId);
      await this.assertNoBranchCycle(id, dto.parentBranchId);
    }

    if (dto.headPersonId !== undefined && dto.headPersonId !== null) {
      await this.assertCanBeBranchHead(dto.headPersonId, id);
    }

    return this.repository.updateBranch(id, {
      parentBranchId: dto.parentBranchId,
      name: dto.name?.trim(),
      type: optionalText(dto.type),
      description: normalizeText(dto.description),
      headPersonId: dto.headPersonId,
      displayOrder: dto.displayOrder,
    });
  }

  async archiveBranch(id: string) {
    await this.findBranchOrThrow(id);
    return this.repository.updateBranch(id, { status: 'ARCHIVED' });
  }

  async getLeadershipHistory(id: string) {
    await this.findBranchOrThrow(id);
    return this.repository.listLeadershipHistory(id);
  }

  async transferLeadership(
    branchId: string,
    dto: TransferLeadershipDto,
    actorUserId?: string,
  ) {
    const branch = await this.findBranchOrThrow(branchId);
    const predecessorId = branch.headPersonId ?? null;

    let successorId: string;
    let transferType: 'INITIAL' | 'MANUAL' | 'AUTO_SENIOR_SON';

    if (dto.successorPersonId) {
      const successor = await this.findPersonOrThrow(dto.successorPersonId);
      if (successor.branchId !== branchId) {
        throw new BadRequestException({
          code: 'HEAD_NOT_IN_BRANCH',
          message: 'Người kế nhiệm phải thuộc chi/nhánh này.',
        });
      }
      await this.assertCanBeBranchHead(dto.successorPersonId, branchId);
      successorId = dto.successorPersonId;
      transferType = predecessorId ? 'MANUAL' : 'INITIAL';
    } else {
      if (!predecessorId) {
        throw new BadRequestException({
          code: 'NO_PREDECESSOR',
          message: 'Chưa có trưởng chi hiện tại để chuyển giao tự động.',
        });
      }
      const candidate = await this.findSeniorLivingSon(predecessorId, branchId);
      if (!candidate) {
        throw new BadRequestException({
          code: 'NO_AUTO_SUCCESSOR',
          message:
            'Không tìm được con trai ruột còn sống trong chi để tự động chuyển giao. Vui lòng chọn thủ công.',
        });
      }
      await this.assertCanBeBranchHead(candidate.id, branchId);
      successorId = candidate.id;
      transferType = 'AUTO_SENIOR_SON';
    }

    if (predecessorId === successorId) {
      throw new BadRequestException({
        code: 'SAME_HEAD',
        message: 'Người kế nhiệm đang là trưởng chi hiện tại.',
      });
    }

    const updated = await this.repository.updateBranch(branchId, {
      headPersonId: successorId,
    });
    await this.repository.createLeadership({
      branchId,
      predecessorPersonId: predecessorId,
      successorPersonId: successorId,
      transferType,
      reason: normalizeText(dto.reason),
      note: normalizeText(dto.note),
      createdByUserId: actorUserId ?? null,
    });

    return updated;
  }

  // ----- Persons -----

  listPersons(input: { branchId?: string; search?: string }) {
    return this.repository.listPersons(input);
  }

  getPerson(id: string) {
    return this.findPersonOrThrow(id);
  }

  async getPersonRelations(id: string): Promise<PersonRelationsRecord> {
    await this.findPersonOrThrow(id);
    const [persons, parentChild, marriages] = await Promise.all([
      this.repository.listPersons(),
      this.repository.listParentChild(),
      this.repository.listMarriages(),
    ]);
    const personsById = indexById(persons);

    const parents = parentChild
      .filter((relation) => relation.childPersonId === id)
      .map((relation) => ({
        relationId: relation.id,
        parentRole: relation.parentRole,
        relationType: relation.relationType,
        person: personsById.get(relation.parentPersonId),
      }))
      .filter(
        (
          entry,
        ): entry is NonNullable<typeof entry> & { person: PersonRecord } =>
          Boolean(entry.person),
      );

    const children = parentChild
      .filter((relation) => relation.parentPersonId === id)
      .map((relation) => ({
        relationId: relation.id,
        parentRole: relation.parentRole,
        relationType: relation.relationType,
        person: personsById.get(relation.childPersonId),
      }))
      .filter(
        (
          entry,
        ): entry is NonNullable<typeof entry> & { person: PersonRecord } =>
          Boolean(entry.person),
      );

    const spouses = buildSpouses(id, marriages, personsById);

    return { parents, children, spouses };
  }

  async createPerson(dto: CreatePersonDto) {
    const clan = await this.findClanOrThrow();

    if (dto.branchId) {
      await this.findBranchOrThrow(dto.branchId);
    }

    const model = this.buildPersonWriteModel(clan.id, null, dto);
    return this.repository.createPerson(model);
  }

  async updatePerson(id: string, dto: UpdatePersonDto) {
    const existing = await this.findPersonOrThrow(id);

    if (dto.branchId) {
      await this.findBranchOrThrow(dto.branchId);
    }

    const nextBranchId =
      dto.branchId !== undefined ? dto.branchId : existing.branchId;
    if (
      existing.branchId &&
      nextBranchId !== existing.branchId &&
      (await this.isBranchHead(id, existing.branchId))
    ) {
      throw new ConflictException({
        code: 'HEAD_BRANCH_CHANGE',
        message:
          'Người này đang là trưởng chi. Hãy chuyển giao trưởng chi trước khi đổi chi/nhánh.',
      });
    }

    const model = this.buildPersonWriteModel(existing.clanId, existing, dto);
    return this.repository.updatePerson(id, model);
  }

  async deletePerson(id: string) {
    await this.findPersonOrThrow(id);
    const references = await this.repository.countPersonReferences(id);

    if (
      references.parentChildRelations > 0 ||
      references.marriages > 0 ||
      references.founderClans > 0 ||
      references.headedBranches > 0
    ) {
      throw new ConflictException({
        code: 'PERSON_IN_USE',
        message:
          'Không thể xoá thành viên đang là thủy tổ, trưởng chi hoặc có quan hệ gia đình.',
        references,
      });
    }

    await this.repository.deletePerson(id);
    return { id };
  }

  // ----- Parent/child -----

  listParentChild() {
    return this.repository.listParentChild();
  }

  async createParentChild(dto: CreateParentChildDto) {
    const clan = await this.findClanOrThrow();

    if (dto.parentPersonId === dto.childPersonId) {
      throw new BadRequestException({
        code: 'INVALID_RELATION_SELF',
        message: 'Không thể gắn quan hệ cha/mẹ với chính người đó.',
      });
    }

    const [parent] = await Promise.all([
      this.findPersonOrThrow(dto.parentPersonId),
      this.findPersonOrThrow(dto.childPersonId),
    ]);

    const parentRole = dto.parentRole as ParentRole;
    const relationType = (dto.relationType ??
      'BIOLOGICAL') as ParentRelationType;

    if (parentRole === 'FATHER' && parent.gender !== 'MALE') {
      throw new BadRequestException({
        code: 'FATHER_MUST_BE_MALE',
        message: 'Cha phải là nam.',
      });
    }
    if (parentRole === 'MOTHER' && parent.gender !== 'FEMALE') {
      throw new BadRequestException({
        code: 'MOTHER_MUST_BE_FEMALE',
        message: 'Mẹ phải là nữ.',
      });
    }

    const relations = await this.repository.listParentChild();

    if (
      relations.some(
        (relation) =>
          relation.childPersonId === dto.childPersonId &&
          relation.parentRole === parentRole &&
          relation.relationType === relationType,
      )
    ) {
      throw new ConflictException({
        code: 'DUPLICATE_PARENT_ROLE',
        message: `Người con này đã có ${parentRoleLabel(parentRole, relationType)}.`,
      });
    }

    if (
      relations.some(
        (relation) =>
          relation.parentPersonId === dto.parentPersonId &&
          relation.childPersonId === dto.childPersonId &&
          relation.relationType === relationType,
      )
    ) {
      throw new ConflictException({
        code: 'DUPLICATE_RELATION',
        message: 'Quan hệ cha/mẹ - con này đã tồn tại.',
      });
    }

    if (wouldCreateCycle(relations, dto.parentPersonId, dto.childPersonId)) {
      throw new BadRequestException({
        code: 'RELATION_CYCLE',
        message: 'Quan hệ này tạo vòng lặp tổ tiên - hậu duệ.',
      });
    }

    return this.repository.createParentChild({
      clanId: clan.id,
      parentPersonId: dto.parentPersonId,
      childPersonId: dto.childPersonId,
      parentRole,
      relationType,
      displayOrder: dto.displayOrder ?? 0,
      note: normalizeText(dto.note),
    });
  }

  async deleteParentChild(id: string) {
    const relation = await this.repository.findParentChild(id);
    if (!relation) {
      throw new NotFoundException({
        code: 'RELATION_NOT_FOUND',
        message: 'Không tìm thấy quan hệ.',
      });
    }
    await this.repository.deleteParentChild(id);
    return { id };
  }

  // ----- Marriages -----

  listMarriages() {
    return this.repository.listMarriages();
  }

  async createMarriage(dto: CreateMarriageDto) {
    const clan = await this.findClanOrThrow();

    if (dto.husbandPersonId === dto.wifePersonId) {
      throw new BadRequestException({
        code: 'INVALID_MARRIAGE_SELF',
        message: 'Không thể kết hôn với chính mình.',
      });
    }

    const [husband, wife] = await Promise.all([
      this.findPersonOrThrow(dto.husbandPersonId),
      this.findPersonOrThrow(dto.wifePersonId),
    ]);

    if (husband.gender !== 'MALE') {
      throw new BadRequestException({
        code: 'HUSBAND_MUST_BE_MALE',
        message: 'Chồng phải là nam.',
      });
    }
    if (wife.gender !== 'FEMALE') {
      throw new BadRequestException({
        code: 'WIFE_MUST_BE_FEMALE',
        message: 'Vợ phải là nữ.',
      });
    }

    const marriages = await this.repository.listMarriages();
    if (
      marriages.some(
        (marriage) =>
          marriage.husbandPersonId === dto.husbandPersonId &&
          marriage.wifePersonId === dto.wifePersonId,
      )
    ) {
      throw new ConflictException({
        code: 'DUPLICATE_MARRIAGE',
        message: 'Cuộc hôn nhân này đã tồn tại.',
      });
    }

    return this.repository.createMarriage({
      clanId: clan.id,
      husbandPersonId: dto.husbandPersonId,
      wifePersonId: dto.wifePersonId,
      status: (dto.status ?? 'ACTIVE') as MarriageStatus,
      marriedSolarDate: normalizeText(dto.marriedSolarDate),
      endedSolarDate: normalizeText(dto.endedSolarDate),
      note: normalizeText(dto.note),
    });
  }

  async updateMarriage(id: string, dto: UpdateMarriageDto) {
    await this.findMarriageOrThrow(id);
    return this.repository.updateMarriage(id, {
      status: dto.status as MarriageStatus | undefined,
      marriedSolarDate: dto.marriedSolarDate,
      endedSolarDate: dto.endedSolarDate,
      note: dto.note,
    });
  }

  async deleteMarriage(id: string) {
    await this.findMarriageOrThrow(id);
    await this.repository.deleteMarriage(id);
    return { id };
  }

  // ----- Family tree -----

  async getFamilyTree(input: {
    branchId?: string;
    personId?: string;
  }): Promise<FamilyTreeRecord> {
    const [clan, persons, parentChild, marriages] = await Promise.all([
      this.repository.getClan(),
      this.repository.listPersons(),
      this.repository.listParentChild(),
      this.repository.listMarriages(),
    ]);

    const personsById = indexById(persons);
    const branchPersonIds = input.branchId
      ? new Set(
          persons
            .filter((person) => person.branchId === input.branchId)
            .map((person) => person.id),
        )
      : null;

    const rootPersonId =
      input.personId ??
      clan?.founderPersonId ??
      findRootPersonId(persons, parentChild);

    const rootPerson = rootPersonId ? personsById.get(rootPersonId) : undefined;

    const nodes = rootPerson
      ? [
          buildFamilyTreeNode(
            rootPerson,
            personsById,
            parentChild,
            marriages,
            branchPersonIds,
            new Set(),
          ),
        ]
      : [];

    return { rootPersonId: rootPerson?.id, nodes };
  }

  // ----- Internal helpers -----

  private async findClanOrThrow(): Promise<ClanRecord> {
    const clan = await this.repository.getClan();
    if (!clan) {
      throw new BadRequestException({
        code: 'CLAN_NOT_CONFIGURED',
        message: 'Cần cấu hình thông tin dòng họ trước.',
      });
    }
    return clan;
  }

  private async findBranchOrThrow(id: string): Promise<BranchRecord> {
    const branch = await this.repository.findBranch(id);
    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'Không tìm thấy chi/nhánh.',
      });
    }
    return branch;
  }

  private async findPersonOrThrow(id: string): Promise<PersonRecord> {
    const person = await this.repository.findPerson(id);
    if (!person) {
      throw new NotFoundException({
        code: 'PERSON_NOT_FOUND',
        message: 'Không tìm thấy thành viên.',
      });
    }
    return person;
  }

  private async findMarriageOrThrow(id: string): Promise<MarriageRecord> {
    const marriage = await this.repository.findMarriage(id);
    if (!marriage) {
      throw new NotFoundException({
        code: 'MARRIAGE_NOT_FOUND',
        message: 'Không tìm thấy hôn nhân.',
      });
    }
    return marriage;
  }

  private async isBranchHead(personId: string, branchId: string) {
    const branch = await this.repository.findBranch(branchId);
    return branch?.headPersonId === personId;
  }

  private async assertCanBeBranchHead(personId: string, branchId: string) {
    const person = await this.findPersonOrThrow(personId);
    if (person.branchId !== branchId) {
      throw new BadRequestException({
        code: 'HEAD_NOT_IN_BRANCH',
        message: 'Trưởng chi phải thuộc chi/nhánh đó.',
      });
    }
    const branches = await this.repository.listBranches();
    if (
      branches.some(
        (branch) => branch.id !== branchId && branch.headPersonId === personId,
      )
    ) {
      throw new ConflictException({
        code: 'ALREADY_BRANCH_HEAD',
        message: 'Người này đang đứng đầu một chi/nhánh khác.',
      });
    }
  }

  private async assertNoBranchCycle(branchId: string, parentBranchId: string) {
    const branches = await this.repository.listBranches();
    const childrenByParent = new Map<string, string[]>();
    for (const branch of branches) {
      if (branch.parentBranchId) {
        const list = childrenByParent.get(branch.parentBranchId) ?? [];
        list.push(branch.id);
        childrenByParent.set(branch.parentBranchId, list);
      }
    }

    const descendants = new Set<string>();
    const stack = [branchId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const childId of childrenByParent.get(current) ?? []) {
        if (!descendants.has(childId)) {
          descendants.add(childId);
          stack.push(childId);
        }
      }
    }

    if (descendants.has(parentBranchId)) {
      throw new BadRequestException({
        code: 'BRANCH_CYCLE',
        message: 'Chi/nhánh cha không hợp lệ vì tạo vòng lặp.',
      });
    }
  }

  private async findSeniorLivingSon(
    parentId: string,
    branchId: string,
  ): Promise<PersonRecord | undefined> {
    const [relations, persons] = await Promise.all([
      this.repository.listParentChild(),
      this.repository.listPersons(),
    ]);
    const personsById = indexById(persons);

    const sons = relations
      .filter(
        (relation) =>
          relation.parentPersonId === parentId &&
          relation.parentRole === 'FATHER' &&
          relation.relationType === 'BIOLOGICAL',
      )
      .map((relation) => ({
        relation,
        person: personsById.get(relation.childPersonId),
      }))
      .filter(
        (
          entry,
        ): entry is {
          relation: ParentChildRelationRecord;
          person: PersonRecord;
        } =>
          Boolean(entry.person) &&
          entry.person!.gender === 'MALE' &&
          entry.person!.lifeStatus === 'LIVING' &&
          entry.person!.branchId === branchId,
      )
      .sort((left, right) => {
        const birthCompare = compareNullableDate(
          left.person.birthSolarDate,
          right.person.birthSolarDate,
        );
        if (birthCompare !== 0) return birthCompare;
        if (left.relation.displayOrder !== right.relation.displayOrder) {
          return left.relation.displayOrder - right.relation.displayOrder;
        }
        return left.person.createdAt.localeCompare(right.person.createdAt);
      });

    return sons[0]?.person;
  }

  private buildPersonWriteModel(
    clanId: string,
    existing: PersonRecord | null,
    dto: CreatePersonDto | UpdatePersonDto,
  ): PersonWriteModel {
    const gender = (pick(dto.gender, existing?.gender) ??
      null) as Gender | null;
    if (!gender) {
      throw new BadRequestException({
        code: 'GENDER_REQUIRED',
        message: 'Bắt buộc chọn giới tính.',
      });
    }

    const lifeStatus = (pick(dto.lifeStatus, existing?.lifeStatus) ??
      'LIVING') as LifeStatus;

    const birthSolarDate = pickText(
      dto.birthSolarDate,
      existing?.birthSolarDate,
    );
    const birthLunarYear = pickNumber(
      dto.birthLunarYear,
      existing?.birthLunarYear,
    );
    const birthLunarMonth = pickNumber(
      dto.birthLunarMonth,
      existing?.birthLunarMonth,
    );
    const birthLunarDay = pickNumber(
      dto.birthLunarDay,
      existing?.birthLunarDay,
    );
    const birthLunarIsLeapMonth =
      pick(dto.birthLunarIsLeapMonth, existing?.birthLunarIsLeapMonth) ?? false;

    assertLunarComplete('sinh', birthLunarYear, birthLunarMonth, birthLunarDay);

    let birthDateSource = (pick(
      dto.birthDateSource,
      existing?.birthDateSource,
    ) ?? undefined) as CalendarType | undefined;
    if (!birthDateSource) {
      if (birthSolarDate) birthDateSource = 'SOLAR';
      else if (birthLunarYear) birthDateSource = 'LUNAR';
    }
    assertSourceConsistent(
      'sinh',
      birthDateSource,
      birthSolarDate,
      birthLunarYear,
      birthLunarMonth,
      birthLunarDay,
    );

    const base = {
      clanId,
      branchId: pickText(dto.branchId, existing?.branchId),
      fullName: (pick(dto.fullName, existing?.fullName) ?? '').trim(),
      commonName: pickText(dto.commonName, existing?.commonName),
      gender,
      isClanMember: pick(dto.isClanMember, existing?.isClanMember) ?? true,
      avatarUrl: pickText(dto.avatarUrl, existing?.avatarUrl),
      generationNumber: pickNumber(
        dto.generationNumber,
        existing?.generationNumber,
      ),
      displayOrder: pick(dto.displayOrder, existing?.displayOrder) ?? 0,
      birthDateSource: birthDateSource ?? null,
      birthSolarDate,
      birthLunarYear,
      birthLunarMonth,
      birthLunarDay,
      birthLunarIsLeapMonth,
    };

    if (!base.fullName || base.fullName.length < 2) {
      throw new BadRequestException({
        code: 'FULL_NAME_REQUIRED',
        message: 'Họ tên không hợp lệ.',
      });
    }

    if (lifeStatus === 'LIVING') {
      return {
        ...base,
        lifeStatus,
        deathDateSource: null,
        deathSolarDate: null,
        deathLunarYear: null,
        deathLunarMonth: null,
        deathLunarDay: null,
        deathLunarIsLeapMonth: false,
        deathAnniversaryCalendar: null,
        deathAnniversaryMonth: null,
        deathAnniversaryDay: null,
        deathAnniversaryIsLeapMonth: false,
        burialPlace: null,
        burialMapUrl: null,
        graveImageUrl: null,
        deathNote: null,
        biography: pickText(dto.biography, existing?.biography),
        hometown: pickText(dto.hometown, existing?.hometown),
        currentLocation: pickText(
          dto.currentLocation,
          existing?.currentLocation,
        ),
      };
    }

    const deathSolarDate = pickText(
      dto.deathSolarDate,
      existing?.deathSolarDate,
    );
    const deathLunarYear = pickNumber(
      dto.deathLunarYear,
      existing?.deathLunarYear,
    );
    const deathLunarMonth = pickNumber(
      dto.deathLunarMonth,
      existing?.deathLunarMonth,
    );
    const deathLunarDay = pickNumber(
      dto.deathLunarDay,
      existing?.deathLunarDay,
    );
    const deathLunarIsLeapMonth =
      pick(dto.deathLunarIsLeapMonth, existing?.deathLunarIsLeapMonth) ?? false;

    assertLunarComplete('mất', deathLunarYear, deathLunarMonth, deathLunarDay);

    let deathDateSource = (pick(
      dto.deathDateSource,
      existing?.deathDateSource,
    ) ?? undefined) as CalendarType | undefined;
    if (!deathDateSource) {
      if (deathSolarDate) deathDateSource = 'SOLAR';
      else if (deathLunarYear) deathDateSource = 'LUNAR';
    }
    assertSourceConsistent(
      'mất',
      deathDateSource,
      deathSolarDate,
      deathLunarYear,
      deathLunarMonth,
      deathLunarDay,
    );

    if (
      base.birthSolarDate &&
      deathSolarDate &&
      deathSolarDate < base.birthSolarDate
    ) {
      throw new BadRequestException({
        code: 'DEATH_BEFORE_BIRTH',
        message: 'Ngày mất không thể trước ngày sinh.',
      });
    }

    const anniversaryCalendar = (pick(
      dto.deathAnniversaryCalendar,
      existing?.deathAnniversaryCalendar,
    ) ?? undefined) as CalendarType | undefined;
    const anniversaryMonth = pickNumber(
      dto.deathAnniversaryMonth,
      existing?.deathAnniversaryMonth,
    );
    const anniversaryDay = pickNumber(
      dto.deathAnniversaryDay,
      existing?.deathAnniversaryDay,
    );
    const anniversaryIsLeapMonth =
      pick(
        dto.deathAnniversaryIsLeapMonth,
        existing?.deathAnniversaryIsLeapMonth,
      ) ?? false;

    const anniversaryParts = [
      anniversaryCalendar,
      anniversaryMonth,
      anniversaryDay,
    ].filter((value) => value !== undefined && value !== null);
    if (anniversaryParts.length > 0 && anniversaryParts.length < 3) {
      throw new BadRequestException({
        code: 'ANNIVERSARY_INCOMPLETE',
        message: 'Ngày giỗ riêng cần đủ lịch, tháng và ngày.',
      });
    }
    if (anniversaryIsLeapMonth && anniversaryCalendar !== 'LUNAR') {
      throw new BadRequestException({
        code: 'ANNIVERSARY_LEAP_NON_LUNAR',
        message: 'Tháng nhuận chỉ áp dụng cho lịch âm.',
      });
    }

    return {
      ...base,
      lifeStatus,
      deathDateSource: deathDateSource ?? null,
      deathSolarDate,
      deathLunarYear,
      deathLunarMonth,
      deathLunarDay,
      deathLunarIsLeapMonth,
      deathAnniversaryCalendar: anniversaryCalendar ?? null,
      deathAnniversaryMonth: anniversaryMonth,
      deathAnniversaryDay: anniversaryDay,
      deathAnniversaryIsLeapMonth: anniversaryIsLeapMonth,
      burialPlace: pickText(dto.burialPlace, existing?.burialPlace),
      burialMapUrl: pickText(dto.burialMapUrl, existing?.burialMapUrl),
      graveImageUrl: pickText(dto.graveImageUrl, existing?.graveImageUrl),
      deathNote: pickText(dto.deathNote, existing?.deathNote),
      biography: pickText(dto.biography, existing?.biography),
      hometown: pickText(dto.hometown, existing?.hometown),
      currentLocation: pickText(dto.currentLocation, existing?.currentLocation),
    };
  }
}

// ----- Pure helpers -----

function normalizeText(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalText(value?: string | null): string | undefined {
  return normalizeText(value) ?? undefined;
}

function pick<T>(value: T | undefined, fallback: T | undefined): T | undefined {
  return value !== undefined ? value : fallback;
}

function pickText(
  value: string | undefined,
  fallback: string | undefined,
): string | null {
  const chosen = value !== undefined ? value : fallback;
  return normalizeText(chosen);
}

function pickNumber(
  value: number | undefined,
  fallback: number | undefined,
): number | null {
  const chosen = value !== undefined ? value : fallback;
  return chosen === undefined || chosen === null ? null : chosen;
}

function assertLunarComplete(
  label: string,
  year: number | null,
  month: number | null,
  day: number | null,
) {
  const parts = [year, month, day].filter(
    (value) => value !== undefined && value !== null,
  );
  if (parts.length > 0 && parts.length < 3) {
    throw new BadRequestException({
      code: 'LUNAR_INCOMPLETE',
      message: `Ngày ${label} âm lịch cần đủ năm, tháng và ngày.`,
    });
  }
}

function assertSourceConsistent(
  label: string,
  source: CalendarType | undefined,
  solarDate: string | null,
  lunarYear: number | null,
  lunarMonth: number | null,
  lunarDay: number | null,
) {
  if (source === 'SOLAR' && !solarDate) {
    throw new BadRequestException({
      code: 'DATE_SOURCE_MISMATCH',
      message: `Nguồn ngày ${label} là dương nhưng thiếu ngày dương.`,
    });
  }
  if (
    source === 'LUNAR' &&
    (lunarYear === null || lunarMonth === null || lunarDay === null)
  ) {
    throw new BadRequestException({
      code: 'DATE_SOURCE_MISMATCH',
      message: `Nguồn ngày ${label} là âm nhưng thiếu ngày âm đầy đủ.`,
    });
  }
}

function indexById(persons: PersonRecord[]): Map<string, PersonRecord> {
  return new Map(persons.map((person) => [person.id, person]));
}

function compareNullableDate(left?: string, right?: string): number {
  if (left && right) return left.localeCompare(right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}

function parentRoleLabel(role: ParentRole, type: ParentRelationType): string {
  const roleLabel = role === 'FATHER' ? 'cha' : 'mẹ';
  return type === 'ADOPTIVE' ? `${roleLabel} nuôi` : `${roleLabel} ruột`;
}

function wouldCreateCycle(
  relations: ParentChildRelationRecord[],
  parentId: string,
  childId: string,
): boolean {
  // Adding parent -> child. Cycle exists if child can already reach parent.
  const childrenByParent = new Map<string, string[]>();
  for (const relation of relations) {
    const list = childrenByParent.get(relation.parentPersonId) ?? [];
    list.push(relation.childPersonId);
    childrenByParent.set(relation.parentPersonId, list);
  }

  const visited = new Set<string>();
  const stack = [childId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === parentId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of childrenByParent.get(current) ?? []) {
      stack.push(next);
    }
  }
  return false;
}

function findRootPersonId(
  persons: PersonRecord[],
  relations: ParentChildRelationRecord[],
): string | undefined {
  const childIds = new Set(relations.map((relation) => relation.childPersonId));
  const roots = persons.filter((person) => !childIds.has(person.id));
  const pool = roots.length > 0 ? roots : persons;
  return [...pool].sort(
    (left, right) =>
      (left.generationNumber ?? 9999) - (right.generationNumber ?? 9999) ||
      left.fullName.localeCompare(right.fullName),
  )[0]?.id;
}

function buildSpouses(
  personId: string,
  marriages: MarriageRecord[],
  personsById: Map<string, PersonRecord>,
): FamilyTreeSpouse[] {
  return marriages
    .filter(
      (marriage) =>
        marriage.husbandPersonId === personId ||
        marriage.wifePersonId === personId,
    )
    .map((marriage) => {
      const spouseId =
        marriage.husbandPersonId === personId
          ? marriage.wifePersonId
          : marriage.husbandPersonId;
      const person = personsById.get(spouseId);
      return person
        ? { marriageId: marriage.id, status: marriage.status, person }
        : undefined;
    })
    .filter((entry): entry is FamilyTreeSpouse => Boolean(entry));
}

function buildFamilyTreeNode(
  person: PersonRecord,
  personsById: Map<string, PersonRecord>,
  relations: ParentChildRelationRecord[],
  marriages: MarriageRecord[],
  branchPersonIds: Set<string> | null,
  visited: Set<string>,
  parentRole?: ParentRole,
  relationType?: ParentRelationType,
): FamilyTreeNode {
  if (visited.has(person.id)) {
    return { person, parentRole, relationType, spouses: [], children: [] };
  }
  const nextVisited = new Set(visited);
  nextVisited.add(person.id);

  const spouses = buildSpouses(person.id, marriages, personsById);

  const childRelations = relations
    .filter((relation) => relation.parentPersonId === person.id)
    .map((relation) => ({
      relation,
      child: personsById.get(relation.childPersonId),
    }))
    .filter(
      (
        entry,
      ): entry is {
        relation: ParentChildRelationRecord;
        child: PersonRecord;
      } =>
        Boolean(entry.child) &&
        (!branchPersonIds || branchPersonIds.has(entry.child!.id)),
    )
    .sort((left, right) => {
      if (left.relation.displayOrder !== right.relation.displayOrder) {
        return left.relation.displayOrder - right.relation.displayOrder;
      }
      const birthCompare = compareNullableDate(
        left.child.birthSolarDate,
        right.child.birthSolarDate,
      );
      if (birthCompare !== 0) return birthCompare;
      return left.child.createdAt.localeCompare(right.child.createdAt);
    });

  const children = childRelations.map((entry) =>
    buildFamilyTreeNode(
      entry.child,
      personsById,
      relations,
      marriages,
      branchPersonIds,
      nextVisited,
      entry.relation.parentRole,
      entry.relation.relationType,
    ),
  );

  return { person, parentRole, relationType, spouses, children };
}

function buildBranchTree(branches: BranchRecord[]): BranchTreeNode[] {
  const nodes = new Map<string, BranchTreeNode>();
  const roots: BranchTreeNode[] = [];

  for (const branch of branches) {
    nodes.set(branch.id, { ...branch, children: [] });
  }

  for (const node of nodes.values()) {
    if (node.parentBranchId && nodes.has(node.parentBranchId)) {
      nodes.get(node.parentBranchId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
