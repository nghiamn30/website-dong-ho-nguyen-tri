import { apiRequest } from "@/lib/auth";

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

export interface AuditLogSummary {
  total: number;
  important: number;
  failed: number;
  memoryLimit: number;
  latestAt?: string;
}

export function getAuditLogs() {
  return apiRequest<AuditLogEntry[]>("/audit-logs");
}

export function getAuditLogSummary() {
  return apiRequest<AuditLogSummary>("/audit-logs/summary");
}
