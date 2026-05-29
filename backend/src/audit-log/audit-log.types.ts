export interface AuditLogEntry {
  id: string;
  action: string;
  actorUserId?: string;
  employeeCode?: string;
  success: boolean;
  important: boolean;
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
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
