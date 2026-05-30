export const GENEALOGY_PERMISSIONS = {
  CLAN_MANAGE: 'clan.manage',
  BRANCHES_MANAGE: 'branches.manage',
  PERSONS_MANAGE: 'persons.manage',
  RELATIONSHIPS_MANAGE: 'relationships.manage',
} as const;

export const BRANCH_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export const CALENDAR_TYPES = ['SOLAR', 'LUNAR'] as const;
export const GENDERS = ['MALE', 'FEMALE'] as const;
export const LIFE_STATUSES = ['LIVING', 'DECEASED'] as const;
export const PARENT_ROLES = ['FATHER', 'MOTHER'] as const;
export const PARENT_RELATION_TYPES = ['BIOLOGICAL', 'ADOPTIVE'] as const;
export const MARRIAGE_STATUSES = [
  'ACTIVE',
  'DIVORCED',
  'WIDOWED',
  'ENDED',
  'UNKNOWN',
] as const;
export const LEADERSHIP_TRANSFER_TYPES = [
  'INITIAL',
  'MANUAL',
  'AUTO_DEATH',
  'AUTO_SENIOR_SON',
] as const;

export type BranchStatus = (typeof BRANCH_STATUSES)[number];
export type CalendarType = (typeof CALENDAR_TYPES)[number];
export type Gender = (typeof GENDERS)[number];
export type LifeStatus = (typeof LIFE_STATUSES)[number];
export type ParentRole = (typeof PARENT_ROLES)[number];
export type ParentRelationType = (typeof PARENT_RELATION_TYPES)[number];
export type MarriageStatus = (typeof MARRIAGE_STATUSES)[number];
export type LeadershipTransferType = (typeof LEADERSHIP_TRANSFER_TYPES)[number];

export interface ClanRecord {
  id: string;
  singletonKey: boolean;
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
  isClanMember: boolean;
  avatarUrl?: string;
  generationNumber?: number;
  displayOrder: number;

  birthDateSource?: CalendarType;
  birthSolarDate?: string;
  birthLunarYear?: number;
  birthLunarMonth?: number;
  birthLunarDay?: number;
  birthLunarIsLeapMonth: boolean;

  lifeStatus: LifeStatus;
  deathDateSource?: CalendarType;
  deathSolarDate?: string;
  deathLunarYear?: number;
  deathLunarMonth?: number;
  deathLunarDay?: number;
  deathLunarIsLeapMonth: boolean;

  deathAnniversaryCalendar?: CalendarType;
  deathAnniversaryMonth?: number;
  deathAnniversaryDay?: number;
  deathAnniversaryIsLeapMonth: boolean;

  burialPlace?: string;
  burialMapUrl?: string;
  graveImageUrl?: string;
  deathNote?: string;

  biography?: string;
  hometown?: string;
  currentLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentChildRelationRecord {
  id: string;
  clanId: string;
  parentPersonId: string;
  childPersonId: string;
  parentRole: ParentRole;
  relationType: ParentRelationType;
  displayOrder: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarriageRecord {
  id: string;
  clanId: string;
  husbandPersonId: string;
  wifePersonId: string;
  status: MarriageStatus;
  marriedSolarDate?: string;
  endedSolarDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchLeadershipHistoryRecord {
  id: string;
  branchId: string;
  predecessorPersonId?: string;
  successorPersonId?: string;
  transferDate: string;
  transferType: LeadershipTransferType;
  reason?: string;
  note?: string;
  createdByUserId?: string;
  createdAt: string;
}

export interface BranchTreeNode extends BranchRecord {
  children: BranchTreeNode[];
}

export interface FamilyTreeSpouse {
  marriageId: string;
  status: MarriageStatus;
  person: PersonRecord;
}

export interface FamilyTreeNode {
  person: PersonRecord;
  parentRole?: ParentRole;
  relationType?: ParentRelationType;
  spouses: FamilyTreeSpouse[];
  children: FamilyTreeNode[];
}

export interface FamilyTreeRecord {
  rootPersonId?: string;
  nodes: FamilyTreeNode[];
}

export interface PersonRelationsRecord {
  parents: Array<{
    relationId: string;
    parentRole: ParentRole;
    relationType: ParentRelationType;
    person: PersonRecord;
  }>;
  children: Array<{
    relationId: string;
    parentRole: ParentRole;
    relationType: ParentRelationType;
    person: PersonRecord;
  }>;
  spouses: FamilyTreeSpouse[];
}
