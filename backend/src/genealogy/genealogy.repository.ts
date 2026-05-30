import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  BranchLeadershipHistoryRecord,
  BranchRecord,
  BranchStatus,
  ClanRecord,
  LeadershipTransferType,
  MarriageRecord,
  MarriageStatus,
  ParentChildRelationRecord,
  ParentRole,
  PersonRecord,
} from './genealogy.types';

type PrismaClan = Prisma.ClanGetPayload<object>;
type PrismaBranch = Prisma.BranchGetPayload<object>;
type PrismaPerson = Prisma.PersonGetPayload<object>;
type PrismaParentChild = Prisma.ParentChildRelationGetPayload<object>;
type PrismaMarriage = Prisma.MarriageGetPayload<object>;
type PrismaLeadership = Prisma.BranchLeadershipHistoryGetPayload<object>;

export interface UpsertClanInput {
  name: string;
  description?: string;
  history?: string;
  founderPersonId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  ancestralHouseName?: string;
  ancestralHouseAddress?: string;
  contactInformation?: string;
}

export interface SaveBranchInput {
  clanId: string;
  parentBranchId: string | null;
  name: string;
  type: string;
  description: string | null;
  headPersonId: string | null;
  displayOrder: number;
}

export interface UpdateBranchInput {
  parentBranchId?: string | null;
  name?: string;
  type?: string;
  description?: string | null;
  headPersonId?: string | null;
  displayOrder?: number;
  status?: BranchStatus;
}

export interface PersonWriteModel {
  clanId: string;
  branchId: string | null;
  fullName: string;
  commonName: string | null;
  gender: PersonRecord['gender'];
  isClanMember: boolean;
  avatarUrl: string | null;
  generationNumber: number | null;
  displayOrder: number;
  birthDateSource: PersonRecord['birthDateSource'] | null;
  birthSolarDate: string | null;
  birthLunarYear: number | null;
  birthLunarMonth: number | null;
  birthLunarDay: number | null;
  birthLunarIsLeapMonth: boolean;
  lifeStatus: PersonRecord['lifeStatus'];
  deathDateSource: PersonRecord['deathDateSource'] | null;
  deathSolarDate: string | null;
  deathLunarYear: number | null;
  deathLunarMonth: number | null;
  deathLunarDay: number | null;
  deathLunarIsLeapMonth: boolean;
  deathAnniversaryCalendar: PersonRecord['deathAnniversaryCalendar'] | null;
  deathAnniversaryMonth: number | null;
  deathAnniversaryDay: number | null;
  deathAnniversaryIsLeapMonth: boolean;
  burialPlace: string | null;
  burialMapUrl: string | null;
  graveImageUrl: string | null;
  deathNote: string | null;
  biography: string | null;
  hometown: string | null;
  currentLocation: string | null;
}

export interface SaveParentChildInput {
  clanId: string;
  parentPersonId: string;
  childPersonId: string;
  parentRole: ParentRole;
  relationType: ParentChildRelationRecord['relationType'];
  displayOrder: number;
  note: string | null;
}

export interface SaveMarriageInput {
  clanId: string;
  husbandPersonId: string;
  wifePersonId: string;
  status: MarriageStatus;
  marriedSolarDate: string | null;
  endedSolarDate: string | null;
  note: string | null;
}

export interface UpdateMarriageInput {
  status?: MarriageStatus;
  marriedSolarDate?: string | null;
  endedSolarDate?: string | null;
  note?: string | null;
}

export interface SaveLeadershipInput {
  branchId: string;
  predecessorPersonId: string | null;
  successorPersonId: string | null;
  transferType: LeadershipTransferType;
  transferDate?: string;
  reason: string | null;
  note: string | null;
  createdByUserId: string | null;
}

export interface ListPersonsInput {
  branchId?: string;
  search?: string;
}

@Injectable()
export class GenealogyRepository {
  private memoryClan: ClanRecord | null = null;
  private readonly memoryBranches: BranchRecord[] = [];
  private readonly memoryPersons: PersonRecord[] = [];
  private readonly memoryParentChild: ParentChildRelationRecord[] = [];
  private readonly memoryMarriages: MarriageRecord[] = [];
  private readonly memoryLeadership: BranchLeadershipHistoryRecord[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  // ----- Clan -----

  async getClan(): Promise<ClanRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const clan = await prisma.clan.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      return clan ? toClanRecord(clan) : null;
    }

    return this.memoryClan ? structuredClone(this.memoryClan) : null;
  }

  async upsertClan(input: UpsertClanInput): Promise<ClanRecord> {
    const prisma = this.getPrisma();
    const current = await this.getClan();
    const now = new Date().toISOString();

    const data = {
      name: input.name,
      description: input.description ?? null,
      history: input.history ?? null,
      founderPersonId: input.founderPersonId ?? null,
      logoUrl: input.logoUrl ?? null,
      bannerUrl: input.bannerUrl ?? null,
      ancestralHouseName: input.ancestralHouseName ?? null,
      ancestralHouseAddress: input.ancestralHouseAddress ?? null,
      contactInformation: input.contactInformation ?? null,
    };

    if (prisma) {
      const clan = current
        ? await prisma.clan.update({ where: { id: current.id }, data })
        : await prisma.clan.create({ data });
      return toClanRecord(clan);
    }

    this.memoryClan = {
      id: current?.id ?? randomUUID(),
      singletonKey: true,
      name: input.name,
      description: input.description,
      history: input.history,
      founderPersonId: input.founderPersonId,
      logoUrl: input.logoUrl,
      bannerUrl: input.bannerUrl,
      ancestralHouseName: input.ancestralHouseName,
      ancestralHouseAddress: input.ancestralHouseAddress,
      contactInformation: input.contactInformation,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };

    return structuredClone(this.memoryClan);
  }

  async setFounder(
    clanId: string,
    founderPersonId: string | null,
  ): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.clan.update({
        where: { id: clanId },
        data: { founderPersonId },
      });
      return;
    }

    if (this.memoryClan && this.memoryClan.id === clanId) {
      this.memoryClan.founderPersonId = founderPersonId ?? undefined;
      this.memoryClan.updatedAt = new Date().toISOString();
    }
  }

  // ----- Branch -----

  async listBranches(): Promise<BranchRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const branches = await prisma.branch.findMany({
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      return branches.map(toBranchRecord);
    }

    return structuredClone(
      [...this.memoryBranches].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder ||
          left.name.localeCompare(right.name),
      ),
    );
  }

  async findBranch(id: string): Promise<BranchRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const branch = await prisma.branch.findUnique({ where: { id } });
      return branch ? toBranchRecord(branch) : null;
    }

    return structuredClone(
      this.memoryBranches.find((branch) => branch.id === id) ?? null,
    );
  }

  async createBranch(input: SaveBranchInput): Promise<BranchRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const branch = await prisma.branch.create({
        data: {
          clanId: input.clanId,
          parentBranchId: input.parentBranchId,
          name: input.name,
          type: input.type,
          description: input.description,
          headPersonId: input.headPersonId,
          displayOrder: input.displayOrder,
        },
      });
      return toBranchRecord(branch);
    }

    const branch: BranchRecord = {
      id: randomUUID(),
      clanId: input.clanId,
      parentBranchId: input.parentBranchId ?? undefined,
      name: input.name,
      type: input.type,
      description: input.description ?? undefined,
      headPersonId: input.headPersonId ?? undefined,
      displayOrder: input.displayOrder,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.memoryBranches.push(branch);
    return structuredClone(branch);
  }

  async updateBranch(
    id: string,
    input: UpdateBranchInput,
  ): Promise<BranchRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const branch = await prisma.branch.update({
        where: { id },
        data: {
          parentBranchId: input.parentBranchId,
          name: input.name,
          type: input.type,
          description: input.description,
          headPersonId: input.headPersonId,
          displayOrder: input.displayOrder,
          status: input.status,
        },
      });
      return toBranchRecord(branch);
    }

    const branch = this.findMemoryBranchOrThrow(id);
    applyOptional(branch, 'parentBranchId', input.parentBranchId);
    applyOptional(branch, 'name', input.name);
    applyOptional(branch, 'type', input.type);
    applyOptional(branch, 'description', input.description);
    applyOptional(branch, 'headPersonId', input.headPersonId);
    applyOptional(branch, 'displayOrder', input.displayOrder);
    applyOptional(branch, 'status', input.status);
    branch.updatedAt = new Date().toISOString();
    return structuredClone(branch);
  }

  async clearBranchHeadForPerson(personId: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.branch.updateMany({
        where: { headPersonId: personId },
        data: { headPersonId: null },
      });
      return;
    }

    for (const branch of this.memoryBranches) {
      if (branch.headPersonId === personId) {
        branch.headPersonId = undefined;
        branch.updatedAt = new Date().toISOString();
      }
    }
  }

  // ----- Person -----

  async listPersons(input: ListPersonsInput = {}): Promise<PersonRecord[]> {
    const prisma = this.getPrisma();
    const normalizedSearch = input.search?.trim();

    if (prisma) {
      const persons = await prisma.person.findMany({
        where: {
          branchId: input.branchId,
          fullName: normalizedSearch
            ? { contains: normalizedSearch, mode: 'insensitive' }
            : undefined,
        },
        orderBy: [
          { generationNumber: 'asc' },
          { displayOrder: 'asc' },
          { fullName: 'asc' },
        ],
      });
      return persons.map(toPersonRecord);
    }

    const search = normalizedSearch?.toLowerCase();
    return structuredClone(
      this.memoryPersons
        .filter(
          (person) => !input.branchId || person.branchId === input.branchId,
        )
        .filter((person) =>
          search
            ? [person.fullName, person.commonName, person.hometown]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(search)
            : true,
        )
        .sort(
          (left, right) =>
            (left.generationNumber ?? 9999) -
              (right.generationNumber ?? 9999) ||
            left.displayOrder - right.displayOrder ||
            left.fullName.localeCompare(right.fullName),
        ),
    );
  }

  async findPerson(id: string): Promise<PersonRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const person = await prisma.person.findUnique({ where: { id } });
      return person ? toPersonRecord(person) : null;
    }

    return structuredClone(
      this.memoryPersons.find((person) => person.id === id) ?? null,
    );
  }

  async createPerson(input: PersonWriteModel): Promise<PersonRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const person = await prisma.person.create({
        data: toPrismaPersonData(input) as Prisma.PersonUncheckedCreateInput,
      });
      return toPersonRecord(person);
    }

    const person: PersonRecord = {
      ...writeModelToRecord(input),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.memoryPersons.push(person);
    return structuredClone(person);
  }

  async updatePerson(
    id: string,
    input: PersonWriteModel,
  ): Promise<PersonRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const person = await prisma.person.update({
        where: { id },
        data: toPrismaPersonData(input),
      });
      return toPersonRecord(person);
    }

    const index = this.memoryPersons.findIndex((person) => person.id === id);
    if (index < 0) {
      throw new Error(`Person ${id} not found.`);
    }
    const existing = this.memoryPersons[index];
    const updated: PersonRecord = {
      ...writeModelToRecord(input),
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.memoryPersons[index] = updated;
    return structuredClone(updated);
  }

  async deletePerson(id: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.person.delete({ where: { id } });
      return;
    }

    const index = this.memoryPersons.findIndex((person) => person.id === id);
    if (index >= 0) {
      this.memoryPersons.splice(index, 1);
    }
  }

  async countPersonReferences(personId: string) {
    const prisma = this.getPrisma();

    if (prisma) {
      const [asParent, asChild, marriages, founderClans, headedBranches] =
        await Promise.all([
          prisma.parentChildRelation.count({
            where: { parentPersonId: personId },
          }),
          prisma.parentChildRelation.count({
            where: { childPersonId: personId },
          }),
          prisma.marriage.count({
            where: {
              OR: [{ husbandPersonId: personId }, { wifePersonId: personId }],
            },
          }),
          prisma.clan.count({ where: { founderPersonId: personId } }),
          prisma.branch.count({ where: { headPersonId: personId } }),
        ]);
      return {
        parentChildRelations: asParent + asChild,
        marriages,
        founderClans,
        headedBranches,
      };
    }

    return {
      parentChildRelations: this.memoryParentChild.filter(
        (relation) =>
          relation.parentPersonId === personId ||
          relation.childPersonId === personId,
      ).length,
      marriages: this.memoryMarriages.filter(
        (marriage) =>
          marriage.husbandPersonId === personId ||
          marriage.wifePersonId === personId,
      ).length,
      founderClans: this.memoryClan?.founderPersonId === personId ? 1 : 0,
      headedBranches: this.memoryBranches.filter(
        (branch) => branch.headPersonId === personId,
      ).length,
    };
  }

  // ----- Parent/child relations -----

  async listParentChild(): Promise<ParentChildRelationRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const relations = await prisma.parentChildRelation.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      });
      return relations.map(toParentChildRecord);
    }

    return structuredClone(this.memoryParentChild);
  }

  async findParentChild(id: string): Promise<ParentChildRelationRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const relation = await prisma.parentChildRelation.findUnique({
        where: { id },
      });
      return relation ? toParentChildRecord(relation) : null;
    }

    return structuredClone(
      this.memoryParentChild.find((relation) => relation.id === id) ?? null,
    );
  }

  async createParentChild(
    input: SaveParentChildInput,
  ): Promise<ParentChildRelationRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const relation = await prisma.parentChildRelation.create({
        data: {
          clanId: input.clanId,
          parentPersonId: input.parentPersonId,
          childPersonId: input.childPersonId,
          parentRole: input.parentRole,
          relationType: input.relationType,
          displayOrder: input.displayOrder,
          note: input.note,
        },
      });
      return toParentChildRecord(relation);
    }

    const relation: ParentChildRelationRecord = {
      id: randomUUID(),
      clanId: input.clanId,
      parentPersonId: input.parentPersonId,
      childPersonId: input.childPersonId,
      parentRole: input.parentRole,
      relationType: input.relationType,
      displayOrder: input.displayOrder,
      note: input.note ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryParentChild.push(relation);
    return structuredClone(relation);
  }

  async deleteParentChild(id: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.parentChildRelation.delete({ where: { id } });
      return;
    }

    const index = this.memoryParentChild.findIndex(
      (relation) => relation.id === id,
    );
    if (index >= 0) {
      this.memoryParentChild.splice(index, 1);
    }
  }

  // ----- Marriages -----

  async listMarriages(): Promise<MarriageRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const marriages = await prisma.marriage.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return marriages.map(toMarriageRecord);
    }

    return structuredClone(this.memoryMarriages);
  }

  async findMarriage(id: string): Promise<MarriageRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const marriage = await prisma.marriage.findUnique({ where: { id } });
      return marriage ? toMarriageRecord(marriage) : null;
    }

    return structuredClone(
      this.memoryMarriages.find((marriage) => marriage.id === id) ?? null,
    );
  }

  async createMarriage(input: SaveMarriageInput): Promise<MarriageRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const marriage = await prisma.marriage.create({
        data: {
          clanId: input.clanId,
          husbandPersonId: input.husbandPersonId,
          wifePersonId: input.wifePersonId,
          status: input.status,
          marriedSolarDate: toDate(input.marriedSolarDate),
          endedSolarDate: toDate(input.endedSolarDate),
          note: input.note,
        },
      });
      return toMarriageRecord(marriage);
    }

    const marriage: MarriageRecord = {
      id: randomUUID(),
      clanId: input.clanId,
      husbandPersonId: input.husbandPersonId,
      wifePersonId: input.wifePersonId,
      status: input.status,
      marriedSolarDate: input.marriedSolarDate ?? undefined,
      endedSolarDate: input.endedSolarDate ?? undefined,
      note: input.note ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryMarriages.push(marriage);
    return structuredClone(marriage);
  }

  async updateMarriage(
    id: string,
    input: UpdateMarriageInput,
  ): Promise<MarriageRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const marriage = await prisma.marriage.update({
        where: { id },
        data: {
          status: input.status,
          marriedSolarDate:
            input.marriedSolarDate === undefined
              ? undefined
              : toDate(input.marriedSolarDate),
          endedSolarDate:
            input.endedSolarDate === undefined
              ? undefined
              : toDate(input.endedSolarDate),
          note: input.note,
        },
      });
      return toMarriageRecord(marriage);
    }

    const marriage = this.memoryMarriages.find((item) => item.id === id);
    if (!marriage) {
      throw new Error(`Marriage ${id} not found.`);
    }
    applyOptional(marriage, 'status', input.status);
    applyOptional(marriage, 'marriedSolarDate', input.marriedSolarDate);
    applyOptional(marriage, 'endedSolarDate', input.endedSolarDate);
    applyOptional(marriage, 'note', input.note);
    marriage.updatedAt = new Date().toISOString();
    return structuredClone(marriage);
  }

  async deleteMarriage(id: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.marriage.delete({ where: { id } });
      return;
    }

    const index = this.memoryMarriages.findIndex(
      (marriage) => marriage.id === id,
    );
    if (index >= 0) {
      this.memoryMarriages.splice(index, 1);
    }
  }

  // ----- Branch leadership history -----

  async listLeadershipHistory(
    branchId: string,
  ): Promise<BranchLeadershipHistoryRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const history = await prisma.branchLeadershipHistory.findMany({
        where: { branchId },
        orderBy: [{ transferDate: 'desc' }, { createdAt: 'desc' }],
      });
      return history.map(toLeadershipRecord);
    }

    return structuredClone(
      this.memoryLeadership
        .filter((item) => item.branchId === branchId)
        .sort(
          (left, right) =>
            right.transferDate.localeCompare(left.transferDate) ||
            right.createdAt.localeCompare(left.createdAt),
        ),
    );
  }

  async createLeadership(
    input: SaveLeadershipInput,
  ): Promise<BranchLeadershipHistoryRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const history = await prisma.branchLeadershipHistory.create({
        data: {
          branchId: input.branchId,
          predecessorPersonId: input.predecessorPersonId,
          successorPersonId: input.successorPersonId,
          transferType: input.transferType,
          transferDate: input.transferDate
            ? toDate(input.transferDate)!
            : undefined,
          reason: input.reason,
          note: input.note,
          createdByUserId: input.createdByUserId,
        },
      });
      return toLeadershipRecord(history);
    }

    const history: BranchLeadershipHistoryRecord = {
      id: randomUUID(),
      branchId: input.branchId,
      predecessorPersonId: input.predecessorPersonId ?? undefined,
      successorPersonId: input.successorPersonId ?? undefined,
      transferDate: input.transferDate ?? now.slice(0, 10),
      transferType: input.transferType,
      reason: input.reason ?? undefined,
      note: input.note ?? undefined,
      createdByUserId: input.createdByUserId ?? undefined,
      createdAt: now,
    };
    this.memoryLeadership.push(history);
    return structuredClone(history);
  }

  private findMemoryBranchOrThrow(id: string) {
    const branch = this.memoryBranches.find((item) => item.id === id);
    if (!branch) {
      throw new Error(`Branch ${id} not found.`);
    }
    return branch;
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function applyOptional<T, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | null | undefined,
) {
  if (value === undefined) {
    return;
  }
  target[key] = (value === null ? undefined : value) as T[K];
}

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function fromDate(value: Date | null): string | undefined {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function toClanRecord(clan: PrismaClan): ClanRecord {
  return {
    id: clan.id,
    singletonKey: clan.singletonKey,
    name: clan.name,
    description: clan.description ?? undefined,
    history: clan.history ?? undefined,
    founderPersonId: clan.founderPersonId ?? undefined,
    logoUrl: clan.logoUrl ?? undefined,
    bannerUrl: clan.bannerUrl ?? undefined,
    ancestralHouseName: clan.ancestralHouseName ?? undefined,
    ancestralHouseAddress: clan.ancestralHouseAddress ?? undefined,
    contactInformation: clan.contactInformation ?? undefined,
    createdAt: clan.createdAt.toISOString(),
    updatedAt: clan.updatedAt.toISOString(),
  };
}

function toBranchRecord(branch: PrismaBranch): BranchRecord {
  return {
    id: branch.id,
    clanId: branch.clanId,
    parentBranchId: branch.parentBranchId ?? undefined,
    name: branch.name,
    type: branch.type,
    description: branch.description ?? undefined,
    headPersonId: branch.headPersonId ?? undefined,
    displayOrder: branch.displayOrder,
    status: branch.status,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}

function toPersonRecord(person: PrismaPerson): PersonRecord {
  return {
    id: person.id,
    clanId: person.clanId,
    branchId: person.branchId ?? undefined,
    fullName: person.fullName,
    commonName: person.commonName ?? undefined,
    gender: person.gender,
    isClanMember: person.isClanMember,
    avatarUrl: person.avatarUrl ?? undefined,
    generationNumber: person.generationNumber ?? undefined,
    displayOrder: person.displayOrder,
    birthDateSource: person.birthDateSource ?? undefined,
    birthSolarDate: fromDate(person.birthSolarDate),
    birthLunarYear: person.birthLunarYear ?? undefined,
    birthLunarMonth: person.birthLunarMonth ?? undefined,
    birthLunarDay: person.birthLunarDay ?? undefined,
    birthLunarIsLeapMonth: person.birthLunarIsLeapMonth,
    lifeStatus: person.lifeStatus,
    deathDateSource: person.deathDateSource ?? undefined,
    deathSolarDate: fromDate(person.deathSolarDate),
    deathLunarYear: person.deathLunarYear ?? undefined,
    deathLunarMonth: person.deathLunarMonth ?? undefined,
    deathLunarDay: person.deathLunarDay ?? undefined,
    deathLunarIsLeapMonth: person.deathLunarIsLeapMonth,
    deathAnniversaryCalendar: person.deathAnniversaryCalendar ?? undefined,
    deathAnniversaryMonth: person.deathAnniversaryMonth ?? undefined,
    deathAnniversaryDay: person.deathAnniversaryDay ?? undefined,
    deathAnniversaryIsLeapMonth: person.deathAnniversaryIsLeapMonth,
    burialPlace: person.burialPlace ?? undefined,
    burialMapUrl: person.burialMapUrl ?? undefined,
    graveImageUrl: person.graveImageUrl ?? undefined,
    deathNote: person.deathNote ?? undefined,
    biography: person.biography ?? undefined,
    hometown: person.hometown ?? undefined,
    currentLocation: person.currentLocation ?? undefined,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

function toPrismaPersonData(
  model: PersonWriteModel,
): Prisma.PersonUncheckedUpdateInput {
  return {
    clanId: model.clanId,
    branchId: model.branchId,
    fullName: model.fullName,
    commonName: model.commonName,
    gender: model.gender,
    isClanMember: model.isClanMember,
    avatarUrl: model.avatarUrl,
    generationNumber: model.generationNumber,
    displayOrder: model.displayOrder,
    birthDateSource: model.birthDateSource,
    birthSolarDate: toDate(model.birthSolarDate),
    birthLunarYear: model.birthLunarYear,
    birthLunarMonth: model.birthLunarMonth,
    birthLunarDay: model.birthLunarDay,
    birthLunarIsLeapMonth: model.birthLunarIsLeapMonth,
    lifeStatus: model.lifeStatus,
    deathDateSource: model.deathDateSource,
    deathSolarDate: toDate(model.deathSolarDate),
    deathLunarYear: model.deathLunarYear,
    deathLunarMonth: model.deathLunarMonth,
    deathLunarDay: model.deathLunarDay,
    deathLunarIsLeapMonth: model.deathLunarIsLeapMonth,
    deathAnniversaryCalendar: model.deathAnniversaryCalendar,
    deathAnniversaryMonth: model.deathAnniversaryMonth,
    deathAnniversaryDay: model.deathAnniversaryDay,
    deathAnniversaryIsLeapMonth: model.deathAnniversaryIsLeapMonth,
    burialPlace: model.burialPlace,
    burialMapUrl: model.burialMapUrl,
    graveImageUrl: model.graveImageUrl,
    deathNote: model.deathNote,
    biography: model.biography,
    hometown: model.hometown,
    currentLocation: model.currentLocation,
  };
}

function writeModelToRecord(
  model: PersonWriteModel,
): Omit<PersonRecord, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    clanId: model.clanId,
    branchId: model.branchId ?? undefined,
    fullName: model.fullName,
    commonName: model.commonName ?? undefined,
    gender: model.gender,
    isClanMember: model.isClanMember,
    avatarUrl: model.avatarUrl ?? undefined,
    generationNumber: model.generationNumber ?? undefined,
    displayOrder: model.displayOrder,
    birthDateSource: model.birthDateSource ?? undefined,
    birthSolarDate: model.birthSolarDate ?? undefined,
    birthLunarYear: model.birthLunarYear ?? undefined,
    birthLunarMonth: model.birthLunarMonth ?? undefined,
    birthLunarDay: model.birthLunarDay ?? undefined,
    birthLunarIsLeapMonth: model.birthLunarIsLeapMonth,
    lifeStatus: model.lifeStatus,
    deathDateSource: model.deathDateSource ?? undefined,
    deathSolarDate: model.deathSolarDate ?? undefined,
    deathLunarYear: model.deathLunarYear ?? undefined,
    deathLunarMonth: model.deathLunarMonth ?? undefined,
    deathLunarDay: model.deathLunarDay ?? undefined,
    deathLunarIsLeapMonth: model.deathLunarIsLeapMonth,
    deathAnniversaryCalendar: model.deathAnniversaryCalendar ?? undefined,
    deathAnniversaryMonth: model.deathAnniversaryMonth ?? undefined,
    deathAnniversaryDay: model.deathAnniversaryDay ?? undefined,
    deathAnniversaryIsLeapMonth: model.deathAnniversaryIsLeapMonth,
    burialPlace: model.burialPlace ?? undefined,
    burialMapUrl: model.burialMapUrl ?? undefined,
    graveImageUrl: model.graveImageUrl ?? undefined,
    deathNote: model.deathNote ?? undefined,
    biography: model.biography ?? undefined,
    hometown: model.hometown ?? undefined,
    currentLocation: model.currentLocation ?? undefined,
  };
}

function toParentChildRecord(
  relation: PrismaParentChild,
): ParentChildRelationRecord {
  return {
    id: relation.id,
    clanId: relation.clanId,
    parentPersonId: relation.parentPersonId,
    childPersonId: relation.childPersonId,
    parentRole: relation.parentRole,
    relationType: relation.relationType,
    displayOrder: relation.displayOrder,
    note: relation.note ?? undefined,
    createdAt: relation.createdAt.toISOString(),
    updatedAt: relation.updatedAt.toISOString(),
  };
}

function toMarriageRecord(marriage: PrismaMarriage): MarriageRecord {
  return {
    id: marriage.id,
    clanId: marriage.clanId,
    husbandPersonId: marriage.husbandPersonId,
    wifePersonId: marriage.wifePersonId,
    status: marriage.status,
    marriedSolarDate: fromDate(marriage.marriedSolarDate),
    endedSolarDate: fromDate(marriage.endedSolarDate),
    note: marriage.note ?? undefined,
    createdAt: marriage.createdAt.toISOString(),
    updatedAt: marriage.updatedAt.toISOString(),
  };
}

function toLeadershipRecord(
  history: PrismaLeadership,
): BranchLeadershipHistoryRecord {
  return {
    id: history.id,
    branchId: history.branchId,
    predecessorPersonId: history.predecessorPersonId ?? undefined,
    successorPersonId: history.successorPersonId ?? undefined,
    transferDate: history.transferDate.toISOString().slice(0, 10),
    transferType: history.transferType,
    reason: history.reason ?? undefined,
    note: history.note ?? undefined,
    createdByUserId: history.createdByUserId ?? undefined,
    createdAt: history.createdAt.toISOString(),
  };
}
