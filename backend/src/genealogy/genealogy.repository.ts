import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  BranchRecord,
  BranchStatus,
  CalendarType,
  ClanRecord,
  Gender,
  LifeStatus,
  PersonRecord,
  RelationshipRecord,
  RelationshipType,
} from './genealogy.types';

type PrismaClan = Prisma.ClanGetPayload<object>;
type PrismaBranch = Prisma.BranchGetPayload<object>;
type PrismaPerson = Prisma.PersonGetPayload<object>;
type PrismaRelationship = Prisma.RelationshipGetPayload<object>;

@Injectable()
export class GenealogyRepository {
  private memoryClan: ClanRecord | null = null;
  private readonly memoryBranches: BranchRecord[] = [];
  private readonly memoryPersons: PersonRecord[] = [];
  private readonly memoryRelationships: RelationshipRecord[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

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

    if (prisma) {
      const data = {
        name: input.name,
        description: input.description,
        history: input.history,
        founderPersonId: input.founderPersonId,
        logoUrl: input.logoUrl,
        bannerUrl: input.bannerUrl,
        ancestralHouseName: input.ancestralHouseName,
        ancestralHouseAddress: input.ancestralHouseAddress,
        contactInformation: input.contactInformation,
      };

      const clan = current
        ? await prisma.clan.update({ where: { id: current.id }, data })
        : await prisma.clan.create({ data });

      return toClanRecord(clan);
    }

    this.memoryClan = {
      id: current?.id ?? randomUUID(),
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

  async listBranches(): Promise<BranchRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const branches = await prisma.branch.findMany({
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return branches.map(toBranchRecord);
    }

    return structuredClone(
      this.memoryBranches.sort(
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
      parentBranchId: input.parentBranchId,
      name: input.name,
      type: input.type,
      description: input.description,
      headPersonId: input.headPersonId,
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
    input: Partial<SaveBranchInput> & { status?: BranchStatus },
  ): Promise<BranchRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const branch = await prisma.branch.update({
        where: { id },
        data: input,
      });

      return toBranchRecord(branch);
    }

    const branch = this.findMemoryBranchOrThrow(id);
    Object.assign(branch, removeUndefined(input), {
      updatedAt: new Date().toISOString(),
    });
    return structuredClone(branch);
  }

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
        orderBy: [{ generationNumber: 'asc' }, { fullName: 'asc' }],
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

  async createPerson(input: SavePersonInput): Promise<PersonRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const person = await prisma.person.create({
        data: toPrismaPersonCreateInput(input),
      });

      return toPersonRecord(person);
    }

    const person: PersonRecord = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryPersons.push(person);
    return structuredClone(person);
  }

  async updatePerson(
    id: string,
    input: Partial<SavePersonInput>,
  ): Promise<PersonRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const person = await prisma.person.update({
        where: { id },
        data: toPrismaPersonUpdateInput(input),
      });

      return toPersonRecord(person);
    }

    const person = this.findMemoryPersonOrThrow(id);
    Object.assign(person, removeUndefined(input), {
      updatedAt: new Date().toISOString(),
    });
    return structuredClone(person);
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

  async listRelationships(): Promise<RelationshipRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const relationships = await prisma.relationship.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return relationships.map(toRelationshipRecord);
    }

    return structuredClone(this.memoryRelationships);
  }

  async findRelationship(id: string): Promise<RelationshipRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const relationship = await prisma.relationship.findUnique({
        where: { id },
      });
      return relationship ? toRelationshipRecord(relationship) : null;
    }

    return structuredClone(
      this.memoryRelationships.find((relationship) => relationship.id === id) ??
        null,
    );
  }

  async relationshipExists(input: {
    person1Id: string;
    person2Id: string;
    relationshipType: RelationshipType;
  }) {
    const prisma = this.getPrisma();

    if (prisma) {
      const count = await prisma.relationship.count({ where: input });
      return count > 0;
    }

    return this.memoryRelationships.some(
      (relationship) =>
        relationship.person1Id === input.person1Id &&
        relationship.person2Id === input.person2Id &&
        relationship.relationshipType === input.relationshipType,
    );
  }

  async createRelationship(
    input: SaveRelationshipInput,
  ): Promise<RelationshipRecord> {
    const prisma = this.getPrisma();
    const now = new Date().toISOString();

    if (prisma) {
      const relationship = await prisma.relationship.create({
        data: {
          person1Id: input.person1Id,
          person2Id: input.person2Id,
          relationshipType: input.relationshipType,
          startDate: input.startDate,
          endDate: input.endDate,
          note: input.note,
        },
      });

      return toRelationshipRecord(relationship);
    }

    const relationship: RelationshipRecord = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryRelationships.push(relationship);
    return structuredClone(relationship);
  }

  async deleteRelationship(id: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.relationship.delete({ where: { id } });
      return;
    }

    const index = this.memoryRelationships.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.memoryRelationships.splice(index, 1);
    }
  }

  async countPersonReferences(personId: string) {
    const prisma = this.getPrisma();

    if (prisma) {
      const [relationships, founderClans, headedBranches] = await Promise.all([
        prisma.relationship.count({
          where: { OR: [{ person1Id: personId }, { person2Id: personId }] },
        }),
        prisma.clan.count({ where: { founderPersonId: personId } }),
        prisma.branch.count({ where: { headPersonId: personId } }),
      ]);

      return { relationships, founderClans, headedBranches };
    }

    return {
      relationships: this.memoryRelationships.filter(
        (item) => item.person1Id === personId || item.person2Id === personId,
      ).length,
      founderClans: this.memoryClan?.founderPersonId === personId ? 1 : 0,
      headedBranches: this.memoryBranches.filter(
        (branch) => branch.headPersonId === personId,
      ).length,
    };
  }

  private findMemoryBranchOrThrow(id: string) {
    const branch = this.memoryBranches.find((item) => item.id === id);
    if (!branch) {
      throw new Error(`Branch ${id} not found.`);
    }
    return branch;
  }

  private findMemoryPersonOrThrow(id: string) {
    const person = this.memoryPersons.find((item) => item.id === id);
    if (!person) {
      throw new Error(`Person ${id} not found.`);
    }
    return person;
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

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
  parentBranchId?: string;
  name: string;
  type: string;
  description?: string;
  headPersonId?: string;
  displayOrder: number;
}

export interface ListPersonsInput {
  branchId?: string;
  search?: string;
}

export interface SavePersonInput {
  clanId: string;
  branchId?: string;
  fullName: string;
  commonName?: string;
  gender: Gender;
  avatarUrl?: string;
  generationNumber?: number;
  birthDate?: string;
  birthCalendarType: CalendarType;
  lifeStatus: LifeStatus;
  isBranchHead: boolean;
  biography?: string;
  hometown?: string;
  currentLocation?: string;
}

export interface SaveRelationshipInput {
  person1Id: string;
  person2Id: string;
  relationshipType: RelationshipType;
  startDate?: string;
  endDate?: string;
  note?: string;
}

function toClanRecord(clan: PrismaClan): ClanRecord {
  return {
    id: clan.id,
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
    avatarUrl: person.avatarUrl ?? undefined,
    generationNumber: person.generationNumber ?? undefined,
    birthDate: person.birthDate?.toISOString().slice(0, 10),
    birthCalendarType: person.birthCalendarType,
    lifeStatus: person.lifeStatus,
    isBranchHead: person.isBranchHead,
    biography: person.biography ?? undefined,
    hometown: person.hometown ?? undefined,
    currentLocation: person.currentLocation ?? undefined,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

function toRelationshipRecord(
  relationship: PrismaRelationship,
): RelationshipRecord {
  return {
    id: relationship.id,
    person1Id: relationship.person1Id,
    person2Id: relationship.person2Id,
    relationshipType: relationship.relationshipType,
    startDate: relationship.startDate?.toISOString().slice(0, 10),
    endDate: relationship.endDate?.toISOString().slice(0, 10),
    note: relationship.note ?? undefined,
    createdAt: relationship.createdAt.toISOString(),
    updatedAt: relationship.updatedAt.toISOString(),
  };
}

function toPrismaPersonCreateInput(
  input: SavePersonInput,
): Prisma.PersonUncheckedCreateInput {
  return {
    ...input,
    birthDate: input.birthDate
      ? new Date(`${input.birthDate}T00:00:00Z`)
      : undefined,
  };
}

function toPrismaPersonUpdateInput(
  input: Partial<SavePersonInput>,
): Prisma.PersonUncheckedUpdateInput {
  return removeUndefined({
    ...input,
    birthDate: input.birthDate
      ? new Date(`${input.birthDate}T00:00:00Z`)
      : undefined,
  });
}

function removeUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
