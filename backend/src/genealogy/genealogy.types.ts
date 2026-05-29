export const GENEALOGY_PERMISSIONS = {
  CLAN_MANAGE: 'clan.manage',
  BRANCHES_MANAGE: 'branches.manage',
  PERSONS_MANAGE: 'persons.manage',
  RELATIONSHIPS_MANAGE: 'relationships.manage',
} as const;

export const BRANCH_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export const CALENDAR_TYPES = ['SOLAR', 'LUNAR'] as const;
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;
export const LIFE_STATUSES = ['LIVING', 'DECEASED', 'UNKNOWN'] as const;
export const RELATIONSHIP_TYPES = [
  'FATHER',
  'MOTHER',
  'SPOUSE',
  'CHILD',
  'ADOPTED_CHILD',
] as const;

export type BranchStatus = (typeof BRANCH_STATUSES)[number];
export type CalendarType = (typeof CALENDAR_TYPES)[number];
export type Gender = (typeof GENDERS)[number];
export type LifeStatus = (typeof LIFE_STATUSES)[number];
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface ClanRecord {
  id: string;
  name: string;
  description?: string;
  history?: string;
  founderPersonId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  ancestralHouseName?: string;
  ancestralHouseAddress?: string;
  contactInformation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchRecord {
  id: string;
  clanId: string;
  parentBranchId?: string;
  name: string;
  type: string;
  description?: string;
  headPersonId?: string;
  displayOrder: number;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PersonRecord {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipRecord {
  id: string;
  person1Id: string;
  person2Id: string;
  relationshipType: RelationshipType;
  startDate?: string;
  endDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchTreeNode extends BranchRecord {
  children: BranchTreeNode[];
}

export interface FamilyTreeNode {
  person: PersonRecord;
  spouses: PersonRecord[];
  children: FamilyTreeNode[];
}

export interface FamilyTreeRecord {
  rootPersonId?: string;
  nodes: FamilyTreeNode[];
  relationships: RelationshipRecord[];
}
