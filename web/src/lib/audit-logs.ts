import { apiRequest } from "@/lib/auth";

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

export interface AuditLogSummary {
  total: number;
  important: number;
  failed: number;
  memoryLimit: number;
  latestAt?: string;
}

export interface AuditLogFilter {
  action?: string;
  entityType?: string;
  success?: "true" | "false";
}

export function getAuditLogs(filter: AuditLogFilter = {}) {
  const params = new URLSearchParams();
  if (filter.action) params.set("action", filter.action);
  if (filter.entityType) params.set("entityType", filter.entityType);
  if (filter.success) params.set("success", filter.success);
  const query = params.toString();
  return apiRequest<AuditLogEntry[]>(`/audit-logs${query ? `?${query}` : ""}`);
}

export function getAuditLogSummary() {
  return apiRequest<AuditLogSummary>("/audit-logs/summary");
}
