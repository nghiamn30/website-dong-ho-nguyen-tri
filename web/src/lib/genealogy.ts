import { apiRequest } from "@/lib/auth";

export type BranchStatus = "ACTIVE" | "ARCHIVED";
export type CalendarType = "SOLAR" | "LUNAR";
export type Gender = "MALE" | "FEMALE";
export type LifeStatus = "LIVING" | "DECEASED";
export type ParentRole = "FATHER" | "MOTHER";
export type ParentRelationType = "BIOLOGICAL" | "ADOPTIVE";
export type MarriageStatus =
  | "ACTIVE"
  | "DIVORCED"
  | "WIDOWED"
  | "ENDED"
  | "UNKNOWN";
export type LeadershipTransferType =
  | "INITIAL"
  | "MANUAL"
  | "AUTO_DEATH"
  | "AUTO_SENIOR_SON";

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

export interface BranchTreeNode extends BranchRecord {
  children: BranchTreeNode[];
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

export interface PersonRelationEntry {
  relationId: string;
  parentRole: ParentRole;
  relationType: ParentRelationType;
  person: PersonRecord;
}

export interface PersonRelationsRecord {
  parents: PersonRelationEntry[];
  children: PersonRelationEntry[];
  spouses: FamilyTreeSpouse[];
}

export interface ClanPayload {
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

export interface BranchPayload {
  name: string;
  parentBranchId?: string;
  type?: string;
  description?: string;
  displayOrder?: number;
}

export interface PersonPayload {
  fullName: string;
  commonName?: string;
  gender: Gender;
  isClanMember?: boolean;
  branchId?: string;
  avatarUrl?: string;
  generationNumber?: number;
  displayOrder?: number;
  birthSolarDate?: string;
  birthLunarYear?: number;
  birthLunarMonth?: number;
  birthLunarDay?: number;
  birthLunarIsLeapMonth?: boolean;
  lifeStatus?: LifeStatus;
  deathSolarDate?: string;
  deathLunarYear?: number;
  deathLunarMonth?: number;
  deathLunarDay?: number;
  deathLunarIsLeapMonth?: boolean;
  burialPlace?: string;
  deathNote?: string;
  biography?: string;
  hometown?: string;
  currentLocation?: string;
}

export interface ParentChildPayload {
  parentPersonId: string;
  childPersonId: string;
  parentRole: ParentRole;
  relationType?: ParentRelationType;
  note?: string;
}

export interface MarriagePayload {
  husbandPersonId: string;
  wifePersonId: string;
  status?: MarriageStatus;
  marriedSolarDate?: string;
  endedSolarDate?: string;
  note?: string;
}

export interface TransferLeadershipPayload {
  successorPersonId?: string;
  reason?: string;
  note?: string;
}

// ----- Clan -----

export function getClan() {
  return apiRequest<ClanRecord | null>("/genealogy/clan");
}

export function saveClan(payload: ClanPayload) {
  return apiRequest<ClanRecord>("/genealogy/clan", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ----- Branches -----

export function getBranches() {
  return apiRequest<BranchRecord[]>("/genealogy/branches");
}

export function getBranchTree() {
  return apiRequest<BranchTreeNode[]>("/genealogy/branches/tree");
}

export function createBranch(payload: BranchPayload) {
  return apiRequest<BranchRecord>("/genealogy/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBranch(id: string, payload: BranchPayload) {
  return apiRequest<BranchRecord>(`/genealogy/branches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveBranch(id: string) {
  return apiRequest<BranchRecord>(`/genealogy/branches/${id}`, {
    method: "DELETE",
  });
}

export function transferLeadership(
  branchId: string,
  payload: TransferLeadershipPayload,
) {
  return apiRequest<BranchRecord>(
    `/genealogy/branches/${branchId}/transfer-leadership`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getLeadershipHistory(branchId: string) {
  return apiRequest<BranchLeadershipHistoryRecord[]>(
    `/genealogy/branches/${branchId}/leadership-history`,
  );
}

// ----- Persons -----

export function getPersons(search?: string, branchId?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (branchId) params.set("branchId", branchId);
  const query = params.toString();
  return apiRequest<PersonRecord[]>(
    `/genealogy/persons${query ? `?${query}` : ""}`,
  );
}

export function getPerson(id: string) {
  return apiRequest<PersonRecord>(`/genealogy/persons/${id}`);
}

export function getPersonRelations(id: string) {
  return apiRequest<PersonRelationsRecord>(`/genealogy/persons/${id}/relations`);
}

export function createPerson(payload: PersonPayload) {
  return apiRequest<PersonRecord>("/genealogy/persons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePerson(id: string, payload: PersonPayload) {
  return apiRequest<PersonRecord>(`/genealogy/persons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePerson(id: string) {
  return apiRequest<{ id: string }>(`/genealogy/persons/${id}`, {
    method: "DELETE",
  });
}

// ----- Parent/child relations -----

export function getParentChild() {
  return apiRequest<ParentChildRelationRecord[]>("/genealogy/parent-child");
}

export function createParentChild(payload: ParentChildPayload) {
  return apiRequest<ParentChildRelationRecord>("/genealogy/parent-child", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteParentChild(id: string) {
  return apiRequest<{ id: string }>(`/genealogy/parent-child/${id}`, {
    method: "DELETE",
  });
}

// ----- Marriages -----

export function getMarriages() {
  return apiRequest<MarriageRecord[]>("/genealogy/marriages");
}

export function createMarriage(payload: MarriagePayload) {
  return apiRequest<MarriageRecord>("/genealogy/marriages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteMarriage(id: string) {
  return apiRequest<{ id: string }>(`/genealogy/marriages/${id}`, {
    method: "DELETE",
  });
}

// ----- Family tree -----

export function getFamilyTree(
  input: { branchId?: string; personId?: string } = {},
) {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branchId", input.branchId);
  if (input.personId) params.set("personId", input.personId);
  const query = params.toString();
  return apiRequest<FamilyTreeRecord>(
    `/genealogy/family-tree${query ? `?${query}` : ""}`,
  );
}
