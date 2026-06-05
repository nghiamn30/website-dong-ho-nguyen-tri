export const CHANGE_REQUEST_PERMISSIONS = {
  CREATE: 'change-requests.create',
  REVIEW: 'change-requests.review',
} as const;

// Giai đoạn 4 chỉ mở quy trình đề xuất cho thực thể thành viên (person).
export const CHANGE_REQUEST_ENTITY_TYPES = ['person'] as const;
export const CHANGE_REQUEST_TYPES = ['CREATE', 'UPDATE', 'DELETE'] as const;
export const CHANGE_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export type ChangeRequestEntityType =
  (typeof CHANGE_REQUEST_ENTITY_TYPES)[number];
export type ChangeRequestType = (typeof CHANGE_REQUEST_TYPES)[number];
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export interface ChangeRequestRecord {
  id: string;
  requestedBy: string;
  entityType: string;
  entityId?: string;
  requestType: ChangeRequestType;
  proposedData: Record<string, unknown>;
  reason?: string;
  status: ChangeRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestInput {
  requestedBy: string;
  entityType: ChangeRequestEntityType;
  entityId?: string;
  requestType: ChangeRequestType;
  proposedData: Record<string, unknown>;
  reason?: string;
}

export interface ReviewChangeRequestInput {
  status: 'APPROVED' | 'REJECTED';
  reviewedBy: string;
  reviewNote?: string;
  reviewedAt: string;
}

export interface ChangeRequestFilter {
  status?: ChangeRequestStatus;
  requestedBy?: string;
  entityType?: string;
}
