import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateBranchDto,
  CreatePersonDto,
  CreateRelationshipDto,
  UpdateBranchDto,
  UpdatePersonDto,
  UpsertClanDto,
} from './dto/genealogy.dto';
import { GenealogyRepository } from './genealogy.repository';
import {
  BranchRecord,
  BranchTreeNode,
  FamilyTreeNode,
  FamilyTreeRecord,
  PersonRecord,
  RelationshipRecord,
  RelationshipType,
} from './genealogy.types';

@Injectable()
export class GenealogyService {
  constructor(private readonly repository: GenealogyRepository) {}

  getClan() {
    return this.repository.getClan();
  }

  async upsertClan(dto: UpsertClanDto) {
    if (dto.founderPersonId) {
      await this.findPersonOrThrow(dto.founderPersonId);
    }

    return this.repository.upsertClan({
      name: dto.name.trim(),
      description: normalizeOptional(dto.description),
      history: normalizeOptional(dto.history),
      founderPersonId: dto.founderPersonId,
      logoUrl: normalizeOptional(dto.logoUrl),
      bannerUrl: normalizeOptional(dto.bannerUrl),
      ancestralHouseName: normalizeOptional(dto.ancestralHouseName),
      ancestralHouseAddress: normalizeOptional(dto.ancestralHouseAddress),
      contactInformation: normalizeOptional(dto.contactInformation),
    });
  }

  async listBranches() {
    return this.repository.listBranches();
  }

  async getBranchTree(): Promise<BranchTreeNode[]> {
    const branches = await this.repository.listBranches();
    return buildBranchTree(branches);
  }

  async createBranch(dto: CreateBranchDto) {
    const clan = await this.findClanOrThrow();
    await this.assertBranchReferences(dto.parentBranchId, dto.headPersonId);

    return this.repository.createBranch({
      clanId: clan.id,
      parentBranchId: dto.parentBranchId,
      name: dto.name.trim(),
      type: normalizeOptional(dto.type) ?? 'Chi',
      description: normalizeOptional(dto.description),
      headPersonId: dto.headPersonId,
      displayOrder: dto.displayOrder ?? 0,
    });
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    await this.findBranchOrThrow(id);
    await this.assertBranchReferences(dto.parentBranchId, dto.headPersonId, id);

    return this.repository.updateBranch(id, {
      parentBranchId: dto.parentBranchId,
      name: dto.name?.trim(),
      type: normalizeOptional(dto.type),
      description: normalizeOptional(dto.description),
      headPersonId: dto.headPersonId,
      displayOrder: dto.displayOrder,
    });
  }

  async archiveBranch(id: string) {
    await this.findBranchOrThrow(id);
    return this.repository.updateBranch(id, { status: 'ARCHIVED' });
  }

  async listPersons(input: { branchId?: string; search?: string }) {
    return this.repository.listPersons(input);
  }

  async getPerson(id: string) {
    return this.findPersonOrThrow(id);
  }

  async createPerson(dto: CreatePersonDto) {
    const clan = await this.findClanOrThrow();

    if (dto.branchId) {
      await this.findBranchOrThrow(dto.branchId);
    }

    return this.repository.createPerson({
      clanId: clan.id,
      branchId: dto.branchId,
      fullName: dto.fullName.trim(),
      commonName: normalizeOptional(dto.commonName),
      gender: (dto.gender ?? 'UNKNOWN') as never,
      avatarUrl: normalizeOptional(dto.avatarUrl),
      generationNumber: dto.generationNumber,
      birthDate: normalizeOptional(dto.birthDate),
      birthCalendarType: (dto.birthCalendarType ?? 'SOLAR') as never,
      lifeStatus: (dto.lifeStatus ?? 'LIVING') as never,
      isBranchHead: dto.isBranchHead ?? false,
      biography: normalizeOptional(dto.biography),
      hometown: normalizeOptional(dto.hometown),
      currentLocation: normalizeOptional(dto.currentLocation),
    });
  }

  async updatePerson(id: string, dto: UpdatePersonDto) {
    await this.findPersonOrThrow(id);

    if (dto.branchId) {
      await this.findBranchOrThrow(dto.branchId);
    }

    return this.repository.updatePerson(id, {
      branchId: dto.branchId,
      fullName: dto.fullName?.trim(),
      commonName: normalizeOptional(dto.commonName),
      gender: dto.gender as never,
      avatarUrl: normalizeOptional(dto.avatarUrl),
      generationNumber: dto.generationNumber,
      birthDate: normalizeOptional(dto.birthDate),
      birthCalendarType: dto.birthCalendarType as never,
      lifeStatus: dto.lifeStatus as never,
      isBranchHead: dto.isBranchHead,
      biography: normalizeOptional(dto.biography),
      hometown: normalizeOptional(dto.hometown),
      currentLocation: normalizeOptional(dto.currentLocation),
    });
  }

  async deletePerson(id: string) {
    await this.findPersonOrThrow(id);
    const references = await this.repository.countPersonReferences(id);

    if (
      references.relationships > 0 ||
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

  listRelationships() {
    return this.repository.listRelationships();
  }

  async createRelationship(dto: CreateRelationshipDto) {
    if (dto.person1Id === dto.person2Id) {
      throw new BadRequestException({
        code: 'INVALID_RELATIONSHIP_SELF',
        message: 'Không thể gắn quan hệ một người với chính họ.',
      });
    }

    await Promise.all([
      this.findPersonOrThrow(dto.person1Id),
      this.findPersonOrThrow(dto.person2Id),
    ]);

    const relationshipType = dto.relationshipType as RelationshipType;

    if (
      await this.repository.relationshipExists({
        person1Id: dto.person1Id,
        person2Id: dto.person2Id,
        relationshipType,
      })
    ) {
      throw new ConflictException({
        code: 'DUPLICATE_RELATIONSHIP',
        message: 'Quan hệ này đã tồn tại.',
      });
    }

    return this.repository.createRelationship({
      person1Id: dto.person1Id,
      person2Id: dto.person2Id,
      relationshipType,
      startDate: normalizeOptional(dto.startDate),
      endDate: normalizeOptional(dto.endDate),
      note: normalizeOptional(dto.note),
    });
  }

  async deleteRelationship(id: string) {
    await this.findRelationshipOrThrow(id);
    await this.repository.deleteRelationship(id);
    return { id };
  }

  async getFamilyTree(input: {
    branchId?: string;
    personId?: string;
  }): Promise<FamilyTreeRecord> {
    const [clan, allPersons, relationships] = await Promise.all([
      this.repository.getClan(),
      this.repository.listPersons({ branchId: input.branchId }),
      this.repository.listRelationships(),
    ]);
    const rootPersonId =
      input.personId ??
      clan?.founderPersonId ??
      findFirstRootPerson(allPersons);
    const personsById = new Map(
      allPersons.map((person) => [person.id, person]),
    );
    const roots = rootPersonId
      ? [personsById.get(rootPersonId)].filter(
          (person): person is PersonRecord => Boolean(person),
        )
      : findRootPersons(allPersons, relationships);

    return {
      rootPersonId,
      nodes: roots.map((person) =>
        buildFamilyTreeNode(person, personsById, relationships, new Set()),
      ),
      relationships: relationships.filter(
        (relationship) =>
          personsById.has(relationship.person1Id) &&
          personsById.has(relationship.person2Id),
      ),
    };
  }

  private async findClanOrThrow() {
    const clan = await this.repository.getClan();

    if (!clan) {
      throw new BadRequestException({
        code: 'CLAN_NOT_CONFIGURED',
        message: 'Cần cấu hình thông tin dòng họ trước.',
      });
    }

    return clan;
  }

  private async findBranchOrThrow(id: string) {
    const branch = await this.repository.findBranch(id);

    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'Không tìm thấy chi/nhánh.',
      });
    }

    return branch;
  }

  private async findPersonOrThrow(id: string) {
    const person = await this.repository.findPerson(id);

    if (!person) {
      throw new NotFoundException({
        code: 'PERSON_NOT_FOUND',
        message: 'Không tìm thấy thành viên.',
      });
    }

    return person;
  }

  private async findRelationshipOrThrow(id: string) {
    const relationship = await this.repository.findRelationship(id);

    if (!relationship) {
      throw new NotFoundException({
        code: 'RELATIONSHIP_NOT_FOUND',
        message: 'Không tìm thấy quan hệ.',
      });
    }

    return relationship;
  }

  private async assertBranchReferences(
    parentBranchId?: string,
    headPersonId?: string,
    currentBranchId?: string,
  ) {
    if (parentBranchId) {
      if (parentBranchId === currentBranchId) {
        throw new BadRequestException({
          code: 'INVALID_PARENT_BRANCH',
          message: 'Chi/nhánh không thể là cha của chính nó.',
        });
      }

      await this.findBranchOrThrow(parentBranchId);
    }

    if (headPersonId) {
      await this.findPersonOrThrow(headPersonId);
    }
  }
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

function findFirstRootPerson(persons: PersonRecord[]) {
  return persons
    .slice()
    .sort(
      (left, right) =>
        (left.generationNumber ?? 9999) - (right.generationNumber ?? 9999) ||
        left.fullName.localeCompare(right.fullName),
    )[0]?.id;
}

function findRootPersons(
  persons: PersonRecord[],
  relationships: RelationshipRecord[],
) {
  const childIds = new Set(
    relationships
      .map((relationship) => getParentChild(relationship)?.childId)
      .filter((id): id is string => Boolean(id)),
  );

  return persons.filter((person) => !childIds.has(person.id)).slice(0, 5);
}

function buildFamilyTreeNode(
  person: PersonRecord,
  personsById: Map<string, PersonRecord>,
  relationships: RelationshipRecord[],
  visited: Set<string>,
): FamilyTreeNode {
  if (visited.has(person.id)) {
    return { person, spouses: [], children: [] };
  }

  const nextVisited = new Set(visited);
  nextVisited.add(person.id);
  const spouses = relationships
    .filter(
      (relationship) =>
        relationship.relationshipType === 'SPOUSE' &&
        (relationship.person1Id === person.id ||
          relationship.person2Id === person.id),
    )
    .map((relationship) =>
      personsById.get(
        relationship.person1Id === person.id
          ? relationship.person2Id
          : relationship.person1Id,
      ),
    )
    .filter((spouse): spouse is PersonRecord => Boolean(spouse));
  const children = relationships
    .map(getParentChild)
    .filter(
      (relation): relation is { parentId: string; childId: string } =>
        relation !== undefined && relation.parentId === person.id,
    )
    .map((relation) => personsById.get(relation.childId))
    .filter((child): child is PersonRecord => Boolean(child))
    .map((child) =>
      buildFamilyTreeNode(child, personsById, relationships, nextVisited),
    );

  return { person, spouses, children };
}

function getParentChild(relationship: RelationshipRecord) {
  if (
    ['FATHER', 'MOTHER', 'ADOPTED_CHILD'].includes(
      relationship.relationshipType,
    )
  ) {
    return {
      parentId: relationship.person1Id,
      childId: relationship.person2Id,
    };
  }

  if (relationship.relationshipType === 'CHILD') {
    return {
      parentId: relationship.person2Id,
      childId: relationship.person1Id,
    };
  }

  return undefined;
}

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
