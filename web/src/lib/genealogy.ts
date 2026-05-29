import { apiRequest } from "@/lib/auth";

export type BranchStatus = "ACTIVE" | "ARCHIVED";
export type CalendarType = "SOLAR" | "LUNAR";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
export type LifeStatus = "LIVING" | "DECEASED" | "UNKNOWN";
export type RelationshipType =
  | "FATHER"
  | "MOTHER"
  | "SPOUSE"
  | "CHILD"
  | "ADOPTED_CHILD";

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
  headPersonId?: string;
  displayOrder?: number;
}

export interface PersonPayload {
  fullName: string;
  branchId?: string;
  commonName?: string;
  gender?: Gender;
  avatarUrl?: string;
  generationNumber?: number;
  birthDate?: string;
  birthCalendarType?: CalendarType;
  lifeStatus?: LifeStatus;
  isBranchHead?: boolean;
  biography?: string;
  hometown?: string;
  currentLocation?: string;
}

export interface RelationshipPayload {
  person1Id: string;
  person2Id: string;
  relationshipType: RelationshipType;
  startDate?: string;
  endDate?: string;
  note?: string;
}

export function getClan() {
  return apiRequest<ClanRecord | null>("/genealogy/clan");
}

export function saveClan(payload: ClanPayload) {
  return apiRequest<ClanRecord>("/genealogy/clan", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

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

export function getPersons(search?: string, branchId?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (branchId) params.set("branchId", branchId);
  const query = params.toString();
  return apiRequest<PersonRecord[]>(`/genealogy/persons${query ? `?${query}` : ""}`);
}

export function getPerson(id: string) {
  return apiRequest<PersonRecord>(`/genealogy/persons/${id}`);
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

export function getRelationships() {
  return apiRequest<RelationshipRecord[]>("/genealogy/relationships");
}

export function createRelationship(payload: RelationshipPayload) {
  return apiRequest<RelationshipRecord>("/genealogy/relationships", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteRelationship(id: string) {
  return apiRequest<{ id: string }>(`/genealogy/relationships/${id}`, {
    method: "DELETE",
  });
}

export function getFamilyTree(input: { branchId?: string; personId?: string } = {}) {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branchId", input.branchId);
  if (input.personId) params.set("personId", input.personId);
  const query = params.toString();
  return apiRequest<FamilyTreeRecord>(`/genealogy/family-tree${query ? `?${query}` : ""}`);
}

