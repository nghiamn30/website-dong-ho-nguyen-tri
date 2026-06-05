export interface AuditLogEntry {
  id: string;
  action: string;
  actorUserId?: string;
  employeeCode?: string;
  success: boolean;
  important: boolean;
  entityType?: string;
  entityId?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogInput {
  action: string;
  actorUserId?: string;
  employeeCode?: string;
  success: boolean;
  important?: boolean;
  entityType?: string;
  entityId?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogFilter {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  success?: boolean;
  important?: boolean;
}
